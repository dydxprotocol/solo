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

pragma solidity 0.5.4;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IMakerOracle } from "../../external/interfaces/IMakerOracle.sol";
import { IOasisDex } from "../../external/interfaces/IOasisDex.sol";
import { IErc20 } from "../interfaces/IErc20.sol";
import { IPriceOracle } from "../interfaces/IPriceOracle.sol";
import { Math } from "../lib/Math.sol";
import { Monetary } from "../lib/Monetary.sol";
import { Require } from "../lib/Require.sol";
import { Time } from "../lib/Time.sol";


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

    // the value of one wei
    uint256 constant BASE_PRICE = 10 ** 18;

    // the value of medianizer when 1 ETH == 1 USD
    uint256 constant MEDIANIZER_BASE_PRICE = 10 ** 18;

    // maximum price deviation per second
    uint256 constant MAX_DEVIATION_PER_SEC = 2 * 10 ** 14; // 0.02 percent

    // maximum price deviation per update
    uint256 constant MAX_DEVIATION_ABSOLUTE = 2 * 10 ** 16; // 2 percent

    // after an owner call, the number of seconds before any address can start updating the oracle
    uint256 constant OWNER_GRACE_PERIOD = 5 * 60; // 5 minutes

    // ============ Structs ============

    struct PriceInfo {
        bool byOwner;
        uint32 lastUpdate;
        uint128 price;
    }

    // ============ Events ============

    event PriceSet(
        uint256 newPrice
    );

    // ============ Storage ============

    IErc20 public WETH;

    IErc20 public DAI;

    PriceInfo public priceInfo;

    IMakerOracle public ETH_ORACLE;

    IOasisDex public OASIS;

    address public UNISWAP;

    // ============ Constructor =============

    constructor(
        address weth,
        address dai,
        address medianizer,
        address oasis,
        address uniswap,
        uint128 initialPrice
    )
        public
    {
        ETH_ORACLE = IMakerOracle(medianizer);
        WETH = IErc20(weth);
        DAI = IErc20(dai);
        OASIS = IOasisDex(oasis);
        UNISWAP = uniswap;

        priceInfo = PriceInfo({
            byOwner: false,
            lastUpdate: uint32(block.timestamp),
            price: initialPrice
        });
    }

    // ============ Public Functions ============

    function updatePrice()
        external
    {
        Require.that(
            msg.sender == tx.origin, // solium-disable-line security/no-tx-origin
            FILE,
            "Cannot be called by contract"
        );

        PriceInfo memory oldInfo = priceInfo;
        uint256 timeDelta = uint256(Time.currentTime()).sub(oldInfo.lastUpdate);

        Require.that(
            isOwner() || timeDelta >= OWNER_GRACE_PERIOD,
            FILE,
            "Cannot be called in grace period"
        );

        uint256 priceA = getMedianizerPrice();
        uint256 priceB = getOasisPrice();
        uint256 priceC = getUniswapPrice();

        // get the median price (takes the maximum of the non-maximum price)
        uint256 targetPrice = Math.max(priceA, Math.max(priceB, priceC));
        if (targetPrice == priceA) {
            targetPrice = Math.max(priceB, priceC);
        } else if (targetPrice == priceB) {
            targetPrice = Math.max(priceA, priceC);
        } else {
            targetPrice = Math.max(priceA, priceB);
        }

        // Bound price by maximum acceptable deviation
        uint256 acceptableDeviation = Math.getPartial(
            oldInfo.price,
            Math.min(MAX_DEVIATION_ABSOLUTE, MAX_DEVIATION_PER_SEC.mul(timeDelta)),
            BASE_PRICE
        );
        uint256 maxPrice = uint256(oldInfo.price).add(acceptableDeviation);
        uint256 minPrice = uint256(oldInfo.price).sub(acceptableDeviation);
        targetPrice = Math.max(minPrice, Math.min(maxPrice, targetPrice));

        Require.that(
            targetPrice != 0,
            FILE,
            "Price cannot be zero"
        );

        // update the price
        priceInfo = PriceInfo({
            byOwner: isOwner(),
            price: Math.to128(targetPrice),
            lastUpdate: Time.currentTime()
        });
        emit PriceSet(targetPrice);
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

    // ============ Private Functions ============

    function getMedianizerPrice()
        public
        view
        returns (uint256)
    {
        return Math.getPartial(BASE_PRICE, MEDIANIZER_BASE_PRICE, uint256(ETH_ORACLE.read()));
    }

    function getOasisPrice()
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
        return Math.getPartial(BASE_PRICE, num, den);
    }

    function getUniswapPrice()
        public
        view
        returns (uint256)
    {
        address uniswap = UNISWAP;
        uint256 ethAmt = uniswap.balance;
        uint256 daiAmt = DAI.balanceOf(uniswap);
        return Math.getPartial(BASE_PRICE, ethAmt, daiAmt);
    }
}
