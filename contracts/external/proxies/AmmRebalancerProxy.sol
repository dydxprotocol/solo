/*

    Copyright 2021 Dolomite.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

import "../../protocol/interfaces/IExchangeWrapper.sol";
import "../../protocol/interfaces/ISoloMargin.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Require.sol";
import "../../protocol/lib/Types.sol";

import "../lib/TypedSignature.sol";
import "../lib/DolomiteAmmLibrary.sol";

import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";
import "../interfaces/IUniswapV2Router.sol";

import "../helpers/OnlySolo.sol";

contract AmmRebalancerProxy is IExchangeWrapper, OnlySolo, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant FILE = "AmmRebalancerProxy";

    address public DOLOMITE_AMM_FACTORY;
    mapping(address => bytes32) public ROUTER_TO_INIT_CODE_HASH_MAP;

    struct RebalanceParams {
        address[] dolomitePath;
        uint truePriceTokenA;
        uint truePriceTokenB;
        address otherRouter;
        address[] otherPath;
    }

    event RouterInitCodeHashSet(address indexed router, bytes32 initCodeHash);

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address dolomiteAmmFactory,
        address[] memory routers,
        bytes32[] memory initCodeHashes
    )
    public
    OnlySolo(soloMargin)
    {
        DOLOMITE_AMM_FACTORY = dolomiteAmmFactory;

        Require.that(
            routers.length == initCodeHashes.length,
            FILE,
            "routers/initCodes invalid length"
        );
        for (uint i = 0; i < routers.length; i++) {
            ROUTER_TO_INIT_CODE_HASH_MAP[routers[i]] = initCodeHashes[i];
            emit RouterInitCodeHashSet(routers[i], initCodeHashes[i]);
        }
    }

    function adminSetRouterInitCodeHashes(
        address[] calldata routers,
        bytes32[] calldata initCodeHashes
    )
    external
    onlyOwner {
        Require.that(
            routers.length == initCodeHashes.length,
            FILE,
            "routers/initCodes invalid length"
        );

        for (uint i = 0; i < routers.length; i++) {
            ROUTER_TO_INIT_CODE_HASH_MAP[routers[i]] = initCodeHashes[i];
            emit RouterInitCodeHashSet(routers[i], initCodeHashes[i]);
        }
    }

    function performRebalance(
        RebalanceParams memory params
    ) public {
        Require.that(
            params.dolomitePath.length == 2 && params.otherPath.length >= 2,
            FILE,
            "invalid path lengths"
        );
        Require.that(
            params.dolomitePath[0] == params.otherPath[params.otherPath.length - 1] &&
                params.dolomitePath[params.dolomitePath.length - 1] == params.otherPath[0],
            FILE,
            "invalid path alignment"
        );

        address dolomiteFactory = DOLOMITE_AMM_FACTORY;
        address[] memory dolomitePools = DolomiteAmmLibrary.getPools(dolomiteFactory, params.dolomitePath);

        uint dolomiteAmountIn;
        {
            (uint256 reserveA, uint256 reserveB) = DolomiteAmmLibrary.getReservesWei(
                dolomiteFactory,
                params.dolomitePath[0],
                params.dolomitePath[1]
            );
            (bool isAToB, uint _dolomiteAmountIn) = _computeProfitMaximizingTrade(
                params.truePriceTokenA,
                params.truePriceTokenB,
                reserveA,
                reserveB
            );

            Require.that(
                isAToB,
                FILE,
                "invalid aToB"
            );

            dolomiteAmountIn = _dolomiteAmountIn;
        }

        Account.Info[] memory accounts = new Account.Info[](2 + dolomitePools.length);
        accounts[0] = Account.Info({
        owner : msg.sender,
        number : 0
        });
        accounts[1] = Account.Info({
        owner : msg.sender,
        number : 1
        });

        for (uint i = 0; i < dolomitePools.length; i++) {
            accounts[2 + i] = Account.Info({
            owner : dolomitePools[i],
            number : 0
            });
        }

        uint[] memory dolomiteMarketPath = _getMarketPathFromTokenPath(params.dolomitePath);

        uint otherAmountIn;
        {
            // blocked off to prevent the "stack too deep" error
            bytes32 otherInitCodeHash = ROUTER_TO_INIT_CODE_HASH_MAP[params.otherRouter];
            Require.that(
                otherInitCodeHash != bytes32(0),
                FILE,
                "router not recognized"
            );

            // dolomiteAmountIn is the amountOut for the other trade
            //            Require.that(false, FILE, "printing results", dolomiteAmountIn);
            otherAmountIn = DolomiteAmmLibrary.getAmountsIn(
                IUniswapV2Router(params.otherRouter).factory(),
                otherInitCodeHash,
                dolomiteAmountIn,
                params.otherPath
            )[0];
        }

        // 1 action for transferring, 1 for selling via the other router, and trades are paths.length - 1
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2 + params.dolomitePath.length - 1);

        // trade from accountIndex=1 and transfer to 0, to ensure re-balances are down with flash-loaned funds
        // the dolomiteInputMarketId is the output market for the other trade and vice versa
        {
            // done to prevent the "stack too deep" error
            uint otherAmountOut = dolomiteAmountIn;
            actions[0] = _encodeSell(
                1,
                dolomiteMarketPath[dolomiteMarketPath.length - 1],
                dolomiteMarketPath[0],
                otherAmountIn,
                params.otherRouter,
                params.otherPath,
                otherAmountOut // this is the other trade's output amount
            );
        }

        uint[] memory dolomiteAmountsOut = DolomiteAmmLibrary.getAmountsOutWei(dolomiteFactory, dolomiteAmountIn, params.dolomitePath);
        Require.that(
            otherAmountIn <= dolomiteAmountsOut[dolomiteAmountsOut.length - 1],
            FILE,
            "arb closed"
        );

        for (uint i = 0; i < dolomitePools.length; i++) {
            Require.that(
                accounts[i + 2].owner == dolomitePools[i],
                FILE,
                "invalid pool owner address"
            );
            actions[i + 1] = _encodeTrade(
                1,
                i + 2,
                dolomiteMarketPath[i],
                dolomiteMarketPath[i + 1],
                dolomitePools[i],
                dolomiteAmountsOut[i],
                dolomiteAmountsOut[i + 1]
            );
        }
        actions[actions.length - 1] = _encodeTransferAll(
            1,
            0,
            dolomiteMarketPath[dolomiteMarketPath.length - 1]
        );

        SOLO_MARGIN.operate(accounts, actions);
    }

    function exchange(
        address,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata orderData
    )
    external
    onlySolo(msg.sender)
    returns (uint256) {
        (
        address router,
        uint amountOutMin,
        address[] memory path
        ) = abi.decode(orderData, (address, uint, address[]));
        Require.that(
            path[0] == takerToken,
            FILE,
            "path[0] not takerToken"
        );
        Require.that(
            path[path.length - 1] == makerToken,
            FILE,
            "path[last] not makerToken"
        );

        _checkAllowanceAndApprove(takerToken, router, requestedFillAmount);

        uint[] memory amounts = IUniswapV2Router(router).swapExactTokensForTokens(
            requestedFillAmount,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 1
        );

        _checkAllowanceAndApprove(makerToken, receiver, amounts[amounts.length - 1]);

        return amounts[amounts.length - 1];
    }

    function getExchangeCost(
        address makerToken,
        address takerToken,
        uint256 desiredMakerToken,
        bytes calldata orderData
    )
    external
    view
    returns (uint256) {
        (
        address router,
        ,
        address[] memory path
        ) = abi.decode(orderData, (address, uint, address[]));
        Require.that(
            path[0] == takerToken,
            FILE,
            "path[0] not takerToken"
        );
        Require.that(
            path[path.length - 1] == makerToken,
            FILE,
            "path[last] not makerToken"
        );

        return IUniswapV2Router(router).getAmountsIn(desiredMakerToken, path)[0];
    }

    function _computeProfitMaximizingTrade(
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (bool isAToB, uint256 amountIn) {
        isAToB = reserveA.mul(truePriceTokenB).div(reserveB) < truePriceTokenA;

        uint256 invariant = reserveA.mul(reserveB);

        uint256 leftSide = Babylonian.sqrt(
            invariant.mul(isAToB ? truePriceTokenA : truePriceTokenB).mul(1000) /
            uint256(isAToB ? truePriceTokenB : truePriceTokenA).mul(997)
        );
        uint256 rightSide = (isAToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

        // compute the amount that must be sent to move the price to the profit-maximizing price
        amountIn = leftSide.sub(rightSide);
    }

    function _checkAllowanceAndApprove(
        address token,
        address spender,
        uint amount
    ) internal {
        if (IERC20(token).allowance(address(this), spender) < amount) {
            IERC20(token).safeApprove(spender, uint(- 1));
        }
    }

    function _encodeSell(
        uint fromAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        uint amountInWei,
        address router,
        address[] memory path,
        uint amountOutWei
    ) internal view returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Sell,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
        primaryMarketId : primaryMarketId,
        secondaryMarketId : secondaryMarketId,
        otherAddress : address(this),
        otherAccountId : uint(- 1),
        data : abi.encode(router, amountOutWei, path)
        });
    }

    function _encodeTrade(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        address traderAddress,
        uint amountInWei,
        uint amountOutWei
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Trade,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
        primaryMarketId : primaryMarketId,
        secondaryMarketId : secondaryMarketId,
        otherAddress : traderAddress,
        otherAccountId : toAccountIndex,
        data : abi.encode(amountOutWei)
        });
    }

    function _encodeTransferAll(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    function _getMarketPathFromTokenPath(
        address[] memory path
    ) internal view returns (uint[] memory) {
        SoloMargin soloMargin = SOLO_MARGIN;
        uint[] memory marketPath = new uint[](path.length);
        for (uint i = 0; i < path.length; i++) {
            marketPath[i] = soloMargin.getMarketIdByTokenAddress(path[i]);
        }
        return marketPath;
    }

}
