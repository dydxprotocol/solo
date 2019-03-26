/*

    Copyright 2018 dYdX Trading Inc.

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

pragma solidity 0.5.6;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IErc20 } from "../../protocol/interfaces/IErc20.sol";
import { IPriceOracle } from "../../protocol/interfaces/IPriceOracle.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { IMakerOracle } from "../interfaces/IMakerOracle.sol";
import { IOasisDex } from "../interfaces/IOasisDex.sol";


/**
 * @title DaiPriceOracle
 * @author dYdX
 *
 * PriceOracle that gives the price of Dai in USD
 */
contract DaiPriceOracle is
    Ownable,
    IPriceOracle
{
    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant FILE = "DaiPriceOracle";

    uint256 constant DECIMALS = 18;

    uint256 constant EXPECTED_PRICE = ONE_DOLLAR / (10 ** DECIMALS);

    // ============ Structs ============

    struct PriceInfo {
        uint128 price;
        uint32 lastUpdate;
    }

    struct DeviationParams {
        uint64 denominator;
        uint64 maximumPerSecond;
        uint64 maximumAbsolute;
    }

    // ============ Events ============

    event PriceSet(
        PriceInfo newPriceInfo
    );

    // ============ Storage ============

    PriceInfo public g_priceInfo;

    DeviationParams public DEVIATION_PARAMS;

    uint256 public OASIS_ETH_AMOUNT;

    IErc20 public WETH;

    IErc20 public DAI;

    IMakerOracle public MEDIANIZER;

    IOasisDex public OASIS;

    address public UNISWAP;

    // ============ Constructor =============

    constructor(
        address weth,
        address dai,
        address medianizer,
        address oasis,
        address uniswap,
        uint256 oasisEthAmount,
        DeviationParams memory deviationParams
    )
        public
    {
        MEDIANIZER = IMakerOracle(medianizer);
        WETH = IErc20(weth);
        DAI = IErc20(dai);
        OASIS = IOasisDex(oasis);
        UNISWAP = uniswap;
        DEVIATION_PARAMS = deviationParams;
        OASIS_ETH_AMOUNT = oasisEthAmount;
        g_priceInfo = PriceInfo({
            lastUpdate: uint32(block.timestamp),
            price: uint128(EXPECTED_PRICE)
        });
    }

    // ============ Public Functions ============

    function updatePrice(
        uint256 minimum,
        uint256 maximum
    )
        external
        onlyOwner
        returns (PriceInfo memory)
    {
        uint256 newPrice = getBoundedTargetPrice();

        Require.that(
            newPrice >= minimum,
            FILE,
            "newPrice below minimum",
            newPrice,
            minimum
        );

        Require.that(
            newPrice <= maximum,
            FILE,
            "newPrice above maximum",
            newPrice,
            maximum
        );

        g_priceInfo = PriceInfo({
            price: Math.to128(newPrice),
            lastUpdate: Time.currentTime()
        });

        emit PriceSet(g_priceInfo);
        return g_priceInfo;
    }

    // ============ IPriceOracle Functions ============

    function getPrice(
        address /* token */
    )
        public
        view
        returns (Monetary.Price memory)
    {
        return Monetary.Price({
            value: g_priceInfo.price
        });
    }

    // ============ Price-Query Functions ============

    /**
     * Gets the new price that would be stored if updated right now.
     */
    function getBoundedTargetPrice()
        public
        view
        returns (uint256)
    {
        uint256 targetPrice = getTargetPrice();

        PriceInfo memory oldInfo = g_priceInfo;
        uint256 timeDelta = uint256(Time.currentTime()).sub(oldInfo.lastUpdate);
        (uint256 minPrice, uint256 maxPrice) = getPriceBounds(oldInfo.price, timeDelta);
        return boundValue(targetPrice, minPrice, maxPrice);
    }

    /**
     * Gets the USD price of DAI that this contract will move towards when updated. This price is
     * not bounded by the varaibles governing the maximum deviation from the old price.
     */
    function getTargetPrice()
        public
        view
        returns (uint256)
    {
        uint256 ethUsd = getMedianizerPrice();

        return getMidValue(
            EXPECTED_PRICE,
            getOasisPrice(ethUsd),
            getUniswapPrice(ethUsd)
        );
    }

    /**
     * Gets the USD price of ETH according the Maker Medianizer contract.
     */
    function getMedianizerPrice()
        public
        view
        returns (uint256)
    {
        // throws if the price is not fresh
        return uint256(MEDIANIZER.read());
    }

    /**
     * Gets the USD price of DAI according to OasisDEX given the USD price of ETH.
     */
    function getOasisPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        IOasisDex oasis = OASIS;

        // If exchange is not operational, return old value.
        // This allows the price to move only towards 1 USD
        if (
            oasis.isClosed()
            || !oasis.buyEnabled()
            || !oasis.matchingEnabled()
        ) {
            return g_priceInfo.price;
        }

        uint256 numWei = OASIS_ETH_AMOUNT;
        address dai = address(DAI);
        address weth = address(WETH);

        // Assumes at least `numWei` of depth on both sides of the book if the exchange is active.
        // Will revert if not enough depth.
        uint256 daiAmt1 = oasis.getBuyAmount(dai, weth, numWei);
        uint256 daiAmt2 = oasis.getPayAmount(dai, weth, numWei);

        uint256 num = numWei.mul(daiAmt2).add(numWei.mul(daiAmt1));
        uint256 den = daiAmt1.mul(daiAmt2).mul(2);
        return Math.getPartial(ethUsd, num, den);
    }

    /**
     * Gets the USD price of DAI according to Uniswap given the USD price of ETH.
     */
    function getUniswapPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        address uniswap = address(UNISWAP);
        uint256 ethAmt = uniswap.balance;
        uint256 daiAmt = DAI.balanceOf(uniswap);
        return Math.getPartial(ethUsd, ethAmt, daiAmt);
    }

    // ============ Helper Functions ============

    function getPriceBounds(
        uint256 oldPrice,
        uint256 timeDelta
    )
        private
        view
        returns (uint256, uint256)
    {
        DeviationParams memory deviation = DEVIATION_PARAMS;

        uint256 maxDeviation = Math.getPartial(
            oldPrice,
            Math.min(deviation.maximumAbsolute, timeDelta.mul(deviation.maximumPerSecond)),
            deviation.denominator
        );

        return (
            oldPrice.sub(maxDeviation),
            oldPrice.add(maxDeviation)
        );
    }

    function getMidValue(
        uint256 valueA,
        uint256 valueB,
        uint256 valueC
    )
        private
        pure
        returns (uint256)
    {
        uint256 maximum = Math.max(valueA, Math.max(valueB, valueC));
        if (maximum == valueA) {
            return Math.max(valueB, valueC);
        }
        if (maximum == valueB) {
            return Math.max(valueA, valueC);
        }
        return Math.max(valueA, valueB);
    }

    function boundValue(
        uint256 value,
        uint256 minimum,
        uint256 maximum
    )
        private
        pure
        returns (uint256)
    {
        assert(minimum <= maximum);
        return Math.max(minimum, Math.min(maximum, value));
    }
}
