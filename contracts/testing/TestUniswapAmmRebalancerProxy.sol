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

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

import "../external/uniswap-v2/interfaces/IUniswapV2Factory.sol";
import "../external/uniswap-v2/interfaces/IUniswapV2Pair.sol";
import "../external/interfaces/IUniswapV2Router.sol";

import "../protocol/lib/Require.sol";


/**
 * @dev Attempts to swap a Uniswap-V2-style DEX to a particular price using tokens in msg.sender wallet. Allowances must
 *      be set for the tokens that will be swapped, using this contract as the spender
 */
contract TestUniswapAmmRebalancerProxy is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant FILE = "TestUniswapAmmRebalancerProxy";

    // ============ Functions ============

    function swapToPrice(
        address router,
        address tokenA,
        address tokenB,
        uint truePriceTokenA,
        uint truePriceTokenB
    ) external {
        address pair = IUniswapV2Factory(IUniswapV2Router(router).factory()).getPair(tokenA, tokenB);
        Require.that(
            pair != address(0),
            FILE,
            "invalid pair"
        );

        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        (bool isAToB, uint amountIn) = _computeProfitMaximizingTrade(
            tokenA < tokenB ? truePriceTokenA : truePriceTokenB,
            tokenA < tokenB ? truePriceTokenB : truePriceTokenA,
            reserve0,
            reserve1
        );

        address[] memory path = new address[](2);
        if (isAToB) {
            path[0] = tokenA;
            path[1] = tokenB;
        } else {
            path[0] = tokenB;
            path[1] = tokenA;
        }

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).safeApprove(router, amountIn);

        IUniswapV2Router(router).swapExactTokensForTokens(
            amountIn,
            0,
            path,
            msg.sender,
            block.timestamp
        );
    }

    // ============ Internal Functions ============

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
}
