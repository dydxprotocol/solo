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

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

import "../../protocol/interfaces/IExchangeWrapper.sol";
import "../../protocol/interfaces/IDolomiteMargin.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Require.sol";
import "../../protocol/lib/Types.sol";

import "../lib/DolomiteAmmLibrary.sol";
import "../lib/TypedSignature.sol";

import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";
import "../interfaces/IUniswapV2Router.sol";

import "../helpers/OnlyDolomiteMargin.sol";


contract AmmRebalancerProxy is IExchangeWrapper, OnlyDolomiteMargin, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant FILE = "AmmRebalancerProxy";

    address public DOLOMITE_AMM_FACTORY;
    mapping(address => bytes32) public ROUTER_TO_INIT_CODE_HASH_MAP;

    struct RebalanceParams {
        bytes dolomitePath;
        uint truePriceTokenA;
        uint truePriceTokenB;
        address otherRouter;
        bytes otherPath;
    }

    struct RebalanceCache {
        address dolomiteFactory;
        address[] dolomitePools;
    }

    event RouterInitCodeHashSet(address indexed router, bytes32 initCodeHash);

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        address dolomiteAmmFactory,
        address[] memory routers,
        bytes32[] memory initCodeHashes
    )
    public
    OnlyDolomiteMargin(dolomiteMargin)
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

    function exchange(
        address,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata orderData
    )
    external
    onlyDolomiteMargin(msg.sender)
    returns (uint256) {
        (address router, uint amountOutMin, bytes memory rawPath) = abi.decode(orderData, (address, uint, bytes));
        address[] memory path = _decodeRawPath(rawPath);
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
        (address router,, bytes memory rawPath) = abi.decode(orderData, (address, uint, bytes));
        address[] memory path = _decodeRawPath(rawPath);
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

    function performRebalance(
        RebalanceParams memory params
    ) public {
        Require.that(
            params.dolomitePath.length == 40 && params.otherPath.length >= 40 && params.otherPath.length % 20 == 0,
            FILE,
            "invalid path lengths"
        );

        address[] memory dolomitePath = _decodeRawPath(params.dolomitePath);
        address[] memory otherPath = _decodeRawPath(params.otherPath);
        Require.that(
            dolomitePath[0] == otherPath[otherPath.length - 1] && dolomitePath[dolomitePath.length - 1] == otherPath[0],
            FILE,
            "invalid path alignment"
        );

        // solium-disable indentation
        RebalanceCache memory cache;
        {
            address dolomiteFactory = DOLOMITE_AMM_FACTORY;
            cache = RebalanceCache({
                dolomiteFactory: dolomiteFactory,
                dolomitePools: DolomiteAmmLibrary.getPools(dolomiteFactory, dolomitePath)
            });
        }
        // solium-enable indentation

        uint dolomiteAmountIn;
        // solium-disable indentation
        {
            (uint256 reserveA, uint256 reserveB) = DolomiteAmmLibrary.getReservesWei(
                cache.dolomiteFactory,
                dolomitePath[0],
                dolomitePath[1]
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
        // solium-enable indentation

        Account.Info[] memory accounts = new Account.Info[](2 + cache.dolomitePools.length);
        accounts[0] = Account.Info({
            owner : msg.sender,
            number : 0
        });
        accounts[1] = Account.Info({
            owner : msg.sender,
            number : 1
        });

        for (uint i = 0; i < cache.dolomitePools.length; i++) {
            accounts[2 + i] = Account.Info({
                owner : cache.dolomitePools[i],
                number : 0
            });
        }

        uint[] memory dolomiteMarketPath = _getMarketPathFromTokenPath(dolomitePath);

        // solium-disable indentation
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
                otherPath
            )[0];
        }
        // solium-enable indentation

        // 1 action for transferring, 1 for selling via the other router, and trades are paths.length - 1
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2 + dolomitePath.length - 1);

        // trade from accountIndex=1 and transfer to 0, to ensure re-balances are down with flash-loaned funds
        // the dolomiteInputMarketId is the output market for the other trade and vice versa
        // solium-disable indentation
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
        // solium-enable indentation

        uint[] memory dolomiteAmountsOut = DolomiteAmmLibrary.getAmountsOutWei(
            cache.dolomiteFactory,
            dolomiteAmountIn,
            dolomitePath
        );
        Require.that(
            otherAmountIn <= dolomiteAmountsOut[dolomiteAmountsOut.length - 1],
            FILE,
            "arb closed"
        );

        for (uint i = 0; i < cache.dolomitePools.length; i++) {
            Require.that(
                accounts[i + 2].owner == cache.dolomitePools[i],
                FILE,
                "invalid pool owner address"
            );
            actions[i + 1] = _encodeTrade(
                1,
                i + 2,
                dolomiteMarketPath[i],
                dolomiteMarketPath[i + 1],
                cache.dolomitePools[i],
                dolomiteAmountsOut[i],
                dolomiteAmountsOut[i + 1]
            );
        }
        actions[actions.length - 1] = _encodeTransferAll(
            1,
            0,
            dolomiteMarketPath[dolomiteMarketPath.length - 1]
        );

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    // ============ Internal Functions ============

    function _computeProfitMaximizingTrade(
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 reserveA,
        uint256 reserveB
    )
        internal
        pure
        returns (bool isAToB, uint256 amountIn)
    {
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

    function _decodeRawPath(
        bytes memory rawPath
    ) internal pure returns (address[] memory) {
        Require.that(
            rawPath.length % 20 == 0 && rawPath.length >= 40,
            FILE,
            "invalid path length"
        );
        address[] memory path = new address[](rawPath.length / 20);
        for (uint i = 0; i < path.length; i++) {
            uint offset = 20 * i; // 20 bytes per address
            address token;
            // solium-disable-next-line
            assembly {
                token := div(mload(add(add(rawPath, 0x20), offset)), 0x1000000000000000000000000)
            }
            path[i] = token;
        }
        return path;
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
        bytes memory path,
        uint amountOutWei
    ) internal view returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
            actionType : Actions.ActionType.Sell,
            accountId : fromAccountIndex,
            // solium-disable-next-line arg-overflow
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
            // solium-disable-next-line arg-overflow
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
            // solium-disable-next-line arg-overflow
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
        IDolomiteMargin dolomiteMargin = DOLOMITE_MARGIN;
        uint[] memory marketPath = new uint[](path.length);
        for (uint i = 0; i < path.length; i++) {
            marketPath[i] = dolomiteMargin.getMarketIdByTokenAddress(path[i]);
        }
        return marketPath;
    }

}
