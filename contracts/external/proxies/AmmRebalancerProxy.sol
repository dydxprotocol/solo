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

import "../../protocol/interfaces/IExchangeWrapper.sol";
import "../../protocol/interfaces/ISoloMargin.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Require.sol";
import "../../protocol/lib/Types.sol";

import "../lib/TypedSignature.sol";
import "../lib/UniswapV2Library.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../interfaces/IUniswapV2Router.sol";

import "../helpers/OnlySolo.sol";

import "./DolomiteAmmRouterProxy.sol";

contract AmmRebalancerProxy is IExchangeWrapper, OnlySolo, Ownable {
    using SafeERC20 for IERC20;

    bytes32 public constant FILE = "AmmRebalancerProxy";

    DolomiteAmmRouterProxy public DOLOMITE_ROUTER;
    address public DOLOMITE_AMM_FACTORY;
    mapping(address => bytes) public ROUTER_TO_BYTECODE_MAP;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address dolomiteRouter,
        address[] memory routers,
        bytes[] memory initCodes
    )
    public
    OnlySolo(soloMargin)
    {
        DOLOMITE_ROUTER = DolomiteAmmRouterProxy(dolomiteRouter);
        DOLOMITE_AMM_FACTORY = address(DOLOMITE_ROUTER.UNISWAP_FACTORY());

        Require.that(
            routers.length == initCodes.length,
            FILE,
            "routers/initCodes invalid length"
        );
        for (uint i = 0; i < routers.length; i++) {
            ROUTER_TO_BYTECODE_MAP[routers[i]] = initCodes[i];
        }
    }

    function performRebalance(
        address otherRouter,
        address[] calldata dolomitePath,
        uint dolomiteAmountIn,
        address[] calldata otherPath
    ) external {
        Require.that(
            dolomitePath.length >= 2 && otherPath.length >= 2,
            FILE,
            "invalid paths"
        );
        Require.that(
            dolomitePath[0] == otherPath[otherPath.length - 1] && dolomitePath[dolomitePath.length - 1] == otherPath[0],
            FILE,
            "invalid path alignment"
        );

        Account.Info[] memory accounts = new Account.Info[](2 + dolomitePath.length - 1);
        accounts[0] = Account.Info({
        owner : msg.sender,
        number : 0
        });
        accounts[1] = Account.Info({
        owner : msg.sender,
        number : 1
        });

        address dolomiteFactory = DOLOMITE_AMM_FACTORY;
        address otherFactory = IUniswapV2Router(otherRouter).factory();

        address[] memory dolomitePools = UniswapV2Library.getPools(dolomiteFactory, dolomitePath);
        for (uint i = 0; i < dolomitePools.length; i++) {
            accounts[2 + i] = Account.Info({
            owner : dolomitePools[i],
            number : 0
            });
        }

        uint[] memory dolomiteMarketPath = _getMarketPathFromTokenPath(dolomitePath);
        bytes memory otherInitCode = ROUTER_TO_BYTECODE_MAP[otherRouter];
        Require.that(
            otherInitCode.length > 0,
            FILE,
            "router not recognized"
        );

        uint[] memory dolomiteAmountsOut = UniswapV2Library.getAmountsOutWei(dolomiteFactory, dolomiteAmountIn, dolomitePath);

        // dolomiteAmountIn is the amountOut for the other trade
        uint otherAmountIn = UniswapV2Library.getAmountsInWei(
            otherFactory,
            otherInitCode,
            dolomiteAmountIn,
            otherPath
        )[0];
        uint dolomiteInputMarketId = dolomiteMarketPath[0];
        uint dolomiteOutputMarketId = dolomiteMarketPath[dolomiteMarketPath.length - 1];

        // 1 action for transferring, and trades are paths.length - 1
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1 + dolomitePath.length + otherPath.length - 2);

        // trade from accountIndex=1 and transfer to 0, to ensure re-balances are down with flash-loaned funds
        // the dolomiteInputMarketId is the output market for the other trade and vice versa
        actions[0] = _encodeSell(
            1,
            dolomiteOutputMarketId,
            dolomiteInputMarketId,
            otherAmountIn,
            otherRouter,
            otherPath,
            dolomiteAmountIn // this is the other trade's output amount
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
            dolomiteOutputMarketId
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
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
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
