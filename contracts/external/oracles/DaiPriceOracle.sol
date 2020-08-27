/*

    Copyright 2019 dYdX Trading Inc.

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

pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IErc20 } from "../../protocol/interfaces/IErc20.sol";
import { IPriceOracle } from "../../protocol/interfaces/IPriceOracle.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { ICurve } from "../interfaces/ICurve.sol";
import { IMakerOracle } from "../interfaces/IMakerOracle.sol";
import { IUniswapV2Pair } from "../interfaces/IUniswapV2Pair.sol";


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

    // DAI decimals and expected price.
    uint256 constant DECIMALS = 18;
    uint256 constant EXPECTED_PRICE = ONE_DOLLAR / (10 ** DECIMALS);

    // Parameters used when getting the DAI-USD price from Curve.
    uint128 constant CURVE_DAI_ID = 0;
    uint128 constant CURVE_USDC_ID = 1;
    uint256 constant CURVE_FEE_DENOMINATOR = 10000000000;

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

    address public g_poker;

    DeviationParams public DEVIATION_PARAMS;

    IErc20 public WETH;

    IErc20 public DAI;

    IMakerOracle public MEDIANIZER;

    ICurve public CURVE;

    IUniswapV2Pair public UNISWAP;

    // ============ Constructor =============

    constructor(
        address poker,
        address weth,
        address dai,
        address medianizer,
        address curve,
        address uniswap,
        DeviationParams memory deviationParams
    )
        public
    {
        g_poker = poker;
        MEDIANIZER = IMakerOracle(medianizer);
        WETH = IErc20(weth);
        DAI = IErc20(dai);
        CURVE = ICurve(curve);
        UNISWAP = IUniswapV2Pair(uniswap);
        DEVIATION_PARAMS = deviationParams;
        g_priceInfo = PriceInfo({
            lastUpdate: uint32(block.timestamp),
            price: uint128(EXPECTED_PRICE)
        });
    }

    // ============ Admin Functions ============

    function ownerSetPokerAddress(
        address newPoker
    )
        external
        onlyOwner
    {
        g_poker = newPoker;
    }

    // ============ Public Functions ============

    function updatePrice(
        Monetary.Price memory minimum,
        Monetary.Price memory maximum
    )
        public
        returns (PriceInfo memory)
    {
        Require.that(
            msg.sender == g_poker,
            FILE,
            "Only poker can call updatePrice",
            msg.sender
        );

        Monetary.Price memory newPrice = getBoundedTargetPrice();

        Require.that(
            newPrice.value >= minimum.value,
            FILE,
            "newPrice below minimum",
            newPrice.value,
            minimum.value
        );

        Require.that(
            newPrice.value <= maximum.value,
            FILE,
            "newPrice above maximum",
            newPrice.value,
            maximum.value
        );

        g_priceInfo = PriceInfo({
            price: Math.to128(newPrice.value),
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
     * Get the new price that would be stored if updated right now.
     */
    function getBoundedTargetPrice()
        public
        view
        returns (Monetary.Price memory)
    {
        Monetary.Price memory targetPrice = getTargetPrice();

        PriceInfo memory oldInfo = g_priceInfo;
        uint256 timeDelta = uint256(Time.currentTime()).sub(oldInfo.lastUpdate);
        (uint256 minPrice, uint256 maxPrice) = getPriceBounds(oldInfo.price, timeDelta);
        uint256 boundedTargetPrice = boundValue(targetPrice.value, minPrice, maxPrice);

        return Monetary.Price({
            value: boundedTargetPrice
        });
    }

    /**
     * Get the USD price of DAI that this contract will move towards when updated. This price is
     * not bounded by the variables governing the maximum deviation from the old price.
     */
    function getTargetPrice()
        public
        view
        returns (Monetary.Price memory)
    {
        Monetary.Price memory ethUsd = getMedianizerPrice();

        uint256 targetPrice = getMidValue(
            EXPECTED_PRICE,
            getCurvePrice().value,
            getUniswapPrice(ethUsd).value
        );

        return Monetary.Price({
            value: targetPrice
        });
    }

    /**
     * Get the USD price of ETH according the Maker Medianizer contract.
     */
    function getMedianizerPrice()
        public
        view
        returns (Monetary.Price memory)
    {
        // throws if the price is not fresh
        return Monetary.Price({
            value: uint256(MEDIANIZER.read())
        });
    }

    /**
     * Get the USD price of DAI according to Curve.
     */
    function getCurvePrice()
        public
        view
        returns (Monetary.Price memory)
    {
        ICurve curve = CURVE;

        // Get dy when dx = 1, i.e. the amount of DAI we can buy for 1 USDC.
        //
        // After accounting for the fee, this is a very good estimate of the spot price.
        uint256 dyWithFee = curve.get_dy_underlying(CURVE_USDC_ID, CURVE_DAI_ID, 1);
        uint256 fee = curve.fee();
        uint256 dyWithoutFee = dyWithFee.mul(CURVE_FEE_DENOMINATOR).div(
            CURVE_FEE_DENOMINATOR.sub(fee)
        );

        return Monetary.Price({
            value: dyWithoutFee
        });
    }

    /**
     * Get the USD price of DAI according to Uniswap given the USD price of ETH.
     */
    function getUniswapPrice(
        Monetary.Price memory ethUsd
    )
        public
        view
        returns (Monetary.Price memory)
    {
        (uint256 daiAmt, uint256 ethAmt, ) = UNISWAP.getReserves();
        uint256 uniswapPrice = Math.getPartial(ethUsd.value, ethAmt, daiAmt);

        return Monetary.Price({
            value: uniswapPrice
        });
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
