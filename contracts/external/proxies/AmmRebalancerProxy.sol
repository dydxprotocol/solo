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

contract AmmRebalancerProxy is IExchangeWrapper, OnlySolo {
    using SafeERC20 for IERC20;

    bytes32 public constant FILE = "AmmRebalancerProxy";

    DolomiteAmmRouterProxy public DOLOMITE_ROUTER;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address dolomiteRouter
    )
    public
    OnlySolo(soloMargin)
    {
        DOLOMITE_ROUTER = dolomiteRouter;
    }

    function performRebalance(
        address router,
        address[] memory path,
        uint dolomiteAmountIn
    ) external {
        SOLO_MARGIN.operate();
    }

    function exchange(
        address tradeOriginator,
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

        return IUniswapV2Router(router).getAmountsIn(desiredMakerToken, path)[0];
    }

    function _reversePath(address[] memory path) returns (address[] memory) {
        address[] memory reverse = new address[](path.length);
        for (uint i = 0; i < path.length; i++) {
            reverse[i] = path[path.length - 1 - i];
        }
        return reverse;
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

}
