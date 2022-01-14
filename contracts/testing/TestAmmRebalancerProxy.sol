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

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

import "../protocol/interfaces/IExchangeWrapper.sol";
import "../protocol/interfaces/IDolomiteMargin.sol";

import "../protocol/lib/Account.sol";
import "../protocol/lib/Actions.sol";
import "../protocol/lib/Require.sol";
import "../protocol/lib/Types.sol";

import "../external/lib/TypedSignature.sol";
import "../external/lib/DolomiteAmmLibrary.sol";

import "../external/interfaces/IDolomiteAmmFactory.sol";
import "../external/interfaces/IDolomiteAmmPair.sol";
import "../external/interfaces/IUniswapV2Router.sol";

import "../external/helpers/OnlyDolomiteMargin.sol";

/**
 * @dev The difference between this contract and `AmmRebalancerProxy` is this does not rebalance using arbitrage with
 *      another DEX. Instead, it simply swaps to price using msg.sender's funds.
 */
contract TestAmmRebalancerProxy is OnlyDolomiteMargin, Ownable {
    using SafeMath for uint;

    bytes32 public constant FILE = "TestAmmRebalancerProxy";

    address public DOLOMITE_AMM_FACTORY;

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        address dolomiteAmmFactory
    )
    public
    OnlyDolomiteMargin(dolomiteMargin)
    {
        DOLOMITE_AMM_FACTORY = dolomiteAmmFactory;
    }

    function performRebalance(
        address tokenA,
        address tokenB,
        uint truePriceTokenA,
        uint truePriceTokenB
    ) external {
        address dolomiteFactory = DOLOMITE_AMM_FACTORY;

        address[] memory dolomitePath = new address[](2);
        uint dolomiteAmountIn;
        {
            (uint256 reserveA, uint256 reserveB) = DolomiteAmmLibrary.getReservesWei(
                dolomiteFactory,
                tokenA,
                tokenB
            );
            (bool isAToB, uint _dolomiteAmountIn) = _computeProfitMaximizingTrade(
                truePriceTokenA,
                truePriceTokenB,
                reserveA,
                reserveB
            );

            if (isAToB) {
                dolomitePath[0] = tokenA;
                dolomitePath[1] = tokenB;
            } else {
                dolomitePath[0] = tokenB;
                dolomitePath[1] = tokenA;
            }
            dolomiteAmountIn = _dolomiteAmountIn;
        }

        address[] memory dolomitePools = DolomiteAmmLibrary.getPools(dolomiteFactory, dolomitePath);

        Account.Info[] memory accounts = new Account.Info[](1 + dolomitePools.length);
        accounts[0] = Account.Info({
            owner : msg.sender,
            number : 0
        });

        accounts[1] = Account.Info({
            owner : dolomitePools[0],
            number : 0
        });

        uint[] memory dolomiteMarketPath = _getMarketPathFromTokenPath(dolomitePath);

        // trades are dolomitePools.length
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](dolomitePools.length);

        uint[] memory dolomiteAmountsOut = DolomiteAmmLibrary.getAmountsOutWei(
            dolomiteFactory,
            dolomiteAmountIn,
            dolomitePath
        );
        for (uint i = 0; i < dolomitePools.length; i++) {
            Require.that(
                accounts[i + 1].owner == dolomitePools[i],
                FILE,
                "invalid pool owner address"
            );
            actions[i + 1] = _encodeTrade(
                0,
                i + 1,
                dolomiteMarketPath[i],
                dolomiteMarketPath[i + 1],
                dolomitePools[i],
                dolomiteAmountsOut[i],
                dolomiteAmountsOut[i + 1]
            );
        }

        DOLOMITE_MARGIN.operate(accounts, actions);
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
