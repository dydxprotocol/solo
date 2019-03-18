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

    uint64 constant DEVIATION_DENOMINATOR = 100 * 10000; // measured in 0.0001%

    // maximum price deviation per second
    uint64 constant MAX_DEVIATION_PER_SEC = 100; // 0.01%

    // maximum price deviation per update
    uint64 constant MAX_DEVIATION_ABSOLUTE = 10000; // 1%

    // after an owner call, the number of seconds before any address can start updating the oracle
    uint32 constant OWNER_GRACE_PERIOD = 60 * 60; // 60 minutes

    // ============ Structs ============

    struct PriceInfo {
        uint128 price;
        uint32 lastUpdate;
    }

    // ============ Events ============

    event PriceSet(
        uint256 newPrice
    );

    // ============ Storage ============

    IErc20 public WETH;

    IErc20 public DAI;

    PriceInfo public priceInfo;

    IMakerOracle public MEDIANIZER;

    IOasisDex public OASIS;

    address public UNISWAP;

    // ============ Constructor =============

    constructor(
        address weth,
        address dai,
        address medianizer,
        address oasis,
        address uniswap
    )
        public
    {
        MEDIANIZER = IMakerOracle(medianizer);
        WETH = IErc20(weth);
        DAI = IErc20(dai);
        OASIS = IOasisDex(oasis);
        UNISWAP = uniswap;

        priceInfo = PriceInfo({
            lastUpdate: uint32(block.timestamp),
            price: uint128(EXPECTED_PRICE)
        });
    }

    // ============ Public Functions ============

    function updatePrice()
        external
        onlyOwner
        returns (uint256)
    {
        uint256 newPrice = getBoundedTargetPrice();

        priceInfo = PriceInfo({
            price: Math.to128(newPrice),
            lastUpdate: Time.currentTime()
        });

        emit PriceSet(newPrice);
        return newPrice;
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
            value: priceInfo.price
        });
    }

    // ============ Price-Query Functions ============

    /**
     * Gets the new price that would be stored if updated right now
     */
    function getBoundedTargetPrice()
        public
        view
        returns (uint256)
    {
        uint256 targetPrice = getTargetPrice();

        PriceInfo memory oldInfo = priceInfo;
        uint256 timeDelta = uint256(Time.currentTime()).sub(oldInfo.lastUpdate);
        (uint256 minPrice, uint256 maxPrice) = getPriceBounds(oldInfo.price, timeDelta);
        return boundValue(targetPrice, minPrice, maxPrice);
    }

    /**
     * Gets the USD price of DAI
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
     * Gets the USD price of ETH
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
     * Gets the USD price of DAI according to OasisDEX given the USD price of ETH
     */
    function getOasisPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        uint256 offerEthDai = OASIS.getBestOffer(address(WETH), address(DAI));
        uint256 offerDaiEth = OASIS.getBestOffer(address(DAI), address(WETH));

        // if exchange is not operational, return old value
        if (
            OASIS.isClosed()
            || OASIS.buyEnabled()
            || !OASIS.matchingEnabled()
            || offerEthDai == 0
            || offerDaiEth == 0
        ) {
            return priceInfo.price;
        }

        (uint256 ethAmt1, , uint256 daiAmt1, ) = OASIS.getOffer(offerEthDai);
        (uint256 daiAmt2, , uint256 ethAmt2, ) = OASIS.getOffer(offerDaiEth);
        uint256 num = ethAmt1.mul(daiAmt2).add(ethAmt2.mul(daiAmt1));
        uint256 den = daiAmt1.mul(daiAmt2).mul(2);
        return Math.getPartial(ethUsd, num, den);
    }

    /**
     * Gets the USD price of DAI according to Uniswap given the USD price of ETH
     */
    function getUniswapPrice(
        uint256 ethUsd
    )
        public
        view
        returns (uint256)
    {
        address uniswap = UNISWAP;
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
        pure
        returns (uint256, uint256)
    {
        uint256 maxDeviation = Math.getPartial(
            oldPrice,
            Math.min(MAX_DEVIATION_ABSOLUTE, timeDelta.mul(MAX_DEVIATION_PER_SEC)),
            DEVIATION_DENOMINATOR
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
        return Math.max(minimum, Math.min(maximum, value));
    }
}
