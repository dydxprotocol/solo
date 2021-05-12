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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { State } from "./State.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { Account } from "./lib/Account.sol";
import { Cache } from "./lib/Cache.sol";
import { Decimal } from "./lib/Decimal.sol";
import { Interest } from "./lib/Interest.sol";
import { Monetary } from "./lib/Monetary.sol";
import { Require } from "./lib/Require.sol";
import { Storage } from "./lib/Storage.sol";
import { Token } from "./lib/Token.sol";
import { Types } from "./lib/Types.sol";


/**
 * @title Getters
 * @author dYdX
 *
 * Public read-only functions that allow transparency into the state of Solo
 */
contract Getters is
    State
{
function coverage_0x3f6d772c(bytes32 c__0x3f6d772c) public pure {}

    using Cache for Cache.MarketCache;
    using Storage for Storage.State;
    using Types for Types.Par;

    // ============ Constants ============

    bytes32 FILE = "Getters";

    // ============ Getters for Risk ============

    /**
     * Get the global minimum margin-ratio that every position must maintain to prevent being
     * liquidated.
     *
     * @return  The global margin-ratio
     */
    function getMarginRatio()
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0xd8ef385b9fcf5c08b7b7a53f862af1b67019930c23c224e6ace36e232758e9f4); /* function */ 

coverage_0x3f6d772c(0x8c5bc9e70e2acb4ccccf3f284011c5b1ff36f9cb5b2e7c3a19fddf3177cd02d2); /* line */ 
        coverage_0x3f6d772c(0x5375fd5f1222f94abb2ce69dc6695deb81e5b4766f0bfab10e47b11c4777b3b5); /* statement */ 
return g_state.riskParams.marginRatio;
    }

    /**
     * Get the global liquidation spread. This is the spread between oracle prices that incentivizes
     * the liquidation of risky positions.
     *
     * @return  The global liquidation spread
     */
    function getLiquidationSpread()
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0xb30361ed15ddfa60c792ceb8be7c97e063e7073ad4ec18598eaea3aeb2d7c285); /* function */ 

coverage_0x3f6d772c(0x9a1f2464469851b92fd8f577b17315f1ffe3953828694effff3a5215abc41602); /* line */ 
        coverage_0x3f6d772c(0xe3b3e227dcbcd22bb48bf57442ffb7941f8ca3c11e2ad3df8f1f46a76eee08c9); /* statement */ 
return g_state.riskParams.liquidationSpread;
    }

    /**
     * Get the global earnings-rate variable that determines what percentage of the interest paid
     * by borrowers gets passed-on to suppliers.
     *
     * @return  The global earnings rate
     */
    function getEarningsRate()
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0x93eb28c79102ef834933c1cc5feb3c5c31478c29433fa4695bc87757862cc609); /* function */ 

coverage_0x3f6d772c(0x66c9299e822db48030aa366a7aaeb9c9fdc02f712b872736c2200b87f4e2354c); /* line */ 
        coverage_0x3f6d772c(0x24227ac4cf06999fa96d4f1162d6b00750abd8234621f3f9ebfa7e75659cccb8); /* statement */ 
return g_state.riskParams.earningsRate;
    }

    /**
     * Get the global minimum-borrow value which is the minimum value of any new borrow on Solo.
     *
     * @return  The global minimum borrow value
     */
    function getMinBorrowedValue()
        public
        view
        returns (Monetary.Value memory)
    {coverage_0x3f6d772c(0x515b0c1689e8a9f3978ee08e749da49c6397211fda7e658c55732ec03aaed35a); /* function */ 

coverage_0x3f6d772c(0x9ddffabd8dbea41cd8ae7ae0e81c07cba8380f1da26ddfcd0d7d032f4e9126ae); /* line */ 
        coverage_0x3f6d772c(0x8cfa8e2a38d7adec8984014921bd88daff1554b0518398a5f2f8f7ba6410873c); /* statement */ 
return g_state.riskParams.minBorrowedValue;
    }

    /**
     * Get all risk parameters in a single struct.
     *
     * @return  All global risk parameters
     */
    function getRiskParams()
        public
        view
        returns (Storage.RiskParams memory)
    {coverage_0x3f6d772c(0x09f8bd4f22373399732475ef98d332f9e164d50ab5b45b74ed7d3718ee34025f); /* function */ 

coverage_0x3f6d772c(0x2d0aafc621c0037d74beb689a18c03df3b0c68127bcaca671d480c9aa301d05f); /* line */ 
        coverage_0x3f6d772c(0x381d3c988958390e1d260c7ba295181b67b1bb25583988451b2e596779be56e4); /* statement */ 
return g_state.riskParams;
    }

    /**
     * Get all risk parameter limits in a single struct. These are the maximum limits at which the
     * risk parameters can be set by the admin of Solo.
     *
     * @return  All global risk parameter limnits
     */
    function getRiskLimits()
        public
        view
        returns (Storage.RiskLimits memory)
    {coverage_0x3f6d772c(0x8b37fcdb38d1d34813609091e81d9180d5a3c94b47d4ad05c01e986cee76ce7a); /* function */ 

coverage_0x3f6d772c(0x8f130015b5aa16a74ec04fd2b6fa7a529cbae8f1e51c5e4e7cc1fae92d7edbf2); /* line */ 
        coverage_0x3f6d772c(0xfa708da2879dee25163ea39c1256bf7af1e82309266335671e11867bacac98bd); /* statement */ 
return g_state.riskLimits;
    }

    // ============ Getters for Markets ============

    /**
     * Get the total number of markets.
     *
     * @return  The number of markets
     */
    function getNumMarkets()
        public
        view
        returns (uint256)
    {coverage_0x3f6d772c(0x3def589c8cca98c1e100bfb567e44eb87a84c1e73a6ef10981087b958893c343); /* function */ 

coverage_0x3f6d772c(0x19be15d00477806014c9f68fbd26a76351387d2c82be9ca65c5f39e948a8048f); /* line */ 
        coverage_0x3f6d772c(0x75bf61c04ec5db670c497593ba5d60d43ee3e8ba3972e05ec3b900ce3401172c); /* statement */ 
return g_state.numMarkets;
    }

    /**
     * Get the ERC20 token address for a market.
     *
     * @param  marketId  The market to query
     * @return           The token address
     */
    function getMarketTokenAddress(
        uint256 marketId
    )
        public
        view
        returns (address)
    {coverage_0x3f6d772c(0x988a45fab862647fbf34a1612e5fee1ec194b5ed3497868818f8ee2122d51df3); /* function */ 

coverage_0x3f6d772c(0x9a5e52626549a8ef9c36b57c1919053c0a028bf693c9fdd60d427ab37d32b0bb); /* line */ 
        coverage_0x3f6d772c(0x16b05d7a42ff0d99eac5511aafab4d313ea94a296182b4925bc2b6ea54570418); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x261240629aed5ea682d2ea2e4950212eb2b3f426c13d39b1da154d2348990a09); /* line */ 
        coverage_0x3f6d772c(0x87ea7972b40c0f8516ac15b6de313c3c83acd1b3b436453d98d8c601251c0d26); /* statement */ 
return g_state.getToken(marketId);
    }

    /**
     * Get the ERC20 token address for a market.
     *
     * @param  token    The token to query
     * @return          The token's marketId if the token is valid
     */
    function getMarketIdByTokenAddress(
        address token
    )
        public
        view
        returns (uint256)
    {coverage_0x3f6d772c(0xbdf8f3056fac83159b2868d581fd0613660016cfc487012e4b8f8b36b39307a7); /* function */ 

coverage_0x3f6d772c(0x19f1e8bac4b3de3f3cf485e7e83736492f280552b6da67e8fe71040439236db0); /* line */ 
        coverage_0x3f6d772c(0x5356361404cc148ccb3f53a6ae6d4d6a60717d1627f0894b01010f61aa69c884); /* statement */ 
_requireValidToken(token);
coverage_0x3f6d772c(0xffa127a58671a8d8cb1e8eebb31026ba9f24f92a7ae9e836eb129d833b12e8ed); /* line */ 
        coverage_0x3f6d772c(0xbac19898948fe4b752aa053ce00e5f871d5be83eb4171b6a1f421ce9eec9a5e8); /* statement */ 
return g_state.tokenToMarketId[token];
    }

    /**
     * Get the total principal amounts (borrowed and supplied) for a market.
     *
     * @param  marketId  The market to query
     * @return           The total principal amounts
     */
    function getMarketTotalPar(
        uint256 marketId
    )
        public
        view
        returns (Types.TotalPar memory)
    {coverage_0x3f6d772c(0xa57fe865f0314c09b7f85dbf046629f897d8a9464cdec340fa26923685b5d99f); /* function */ 

coverage_0x3f6d772c(0x48a8b91d748280940cd5126f137cb877993fac30baaf9491b1c5689aa5d28731); /* line */ 
        coverage_0x3f6d772c(0x1c828dc0692782f50a291824794ff85ed5a21159a9419eebafd01a885fc29ade); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xef14f2b7642b3bb3dfd2313aac30d95fd9ec0d0bff44319aeaffde021784006e); /* line */ 
        coverage_0x3f6d772c(0x503ee3fc06caf9f27467335334135e6f14ebcc737f2571283d1877410792a14d); /* statement */ 
return g_state.getTotalPar(marketId);
    }

    /**
     * Get the most recently cached interest index for a market.
     *
     * @param  marketId  The market to query
     * @return           The most recent index
     */
    function getMarketCachedIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {coverage_0x3f6d772c(0x1400af1a1b45e91d1d5b6e3cb2fdaab39a88672338478f4db14a812c35e7b363); /* function */ 

coverage_0x3f6d772c(0x57408a6f6ca12a4f252d65cea128ca198efd450086eb2a4d57edace8d57ec4c1); /* line */ 
        coverage_0x3f6d772c(0x91213fd46b5608fca6a289106f48c5da8b93b8dfded57407ee75d3983184af36); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xff5aa2445ca3eb494ecc8352b0c0409779068d0f0d39271cfa02827f8a2a165c); /* line */ 
        coverage_0x3f6d772c(0xf9400e4b3a2db1342f4a7b0758cc077a845f06670e1d2a8ab47b96f777e8660f); /* statement */ 
return g_state.getIndex(marketId);
    }

    /**
     * Get the interest index for a market if it were to be updated right now.
     *
     * @param  marketId  The market to query
     * @return           The estimated current index
     */
    function getMarketCurrentIndex(
        uint256 marketId
    )
        public
        view
        returns (Interest.Index memory)
    {coverage_0x3f6d772c(0xfbe08cd99539cbd183807ef0a6508837861f811eaf9d8ab25e7586c2dff4e9ff); /* function */ 

coverage_0x3f6d772c(0xb3ecb33fce1b08340e6953c1b67e1b1a9c0c7556b72b60312f963ea84f67fc87); /* line */ 
        coverage_0x3f6d772c(0x4fd0ee10ebc90e3f621906b2193d3e9f2ef3134bcd88eaf42a390293bb88dbba); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x24406d6b1bec47c10ba2e99d5fe5c9083b1bf322e079185cb7b7f437c264f82f); /* line */ 
        coverage_0x3f6d772c(0x55fcb406a0b8d7f58c60cf3de218409ed8d6bbee255adbd5e09ac37dc3ad12ec); /* statement */ 
return g_state.fetchNewIndex(marketId, g_state.getIndex(marketId));
    }

    /**
     * Get the price oracle address for a market.
     *
     * @param  marketId  The market to query
     * @return           The price oracle address
     */
    function getMarketPriceOracle(
        uint256 marketId
    )
        public
        view
        returns (IPriceOracle)
    {coverage_0x3f6d772c(0xe91390f857220c0dcb43a6acd8934ce2c8c0e8df09db1ec8dce669503d4b0e68); /* function */ 

coverage_0x3f6d772c(0x1ed22220a61b367bb2f484cfa888559e2f8692f2188ccb89ed6a437964099051); /* line */ 
        coverage_0x3f6d772c(0xc508a902daf943e04e096c3bf57228608530fda2c7ef6b110f30718f690708a6); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xeb599b6edc437714caafe0d68bce9036af08e56ec6facb30e9274ad96c285797); /* line */ 
        coverage_0x3f6d772c(0x112d45652576a61697ddbe76236fea8ac199e599ca78cbb68d7a20fab9b7a543); /* statement */ 
return g_state.markets[marketId].priceOracle;
    }

    /**
     * Get the interest-setter address for a market.
     *
     * @param  marketId  The market to query
     * @return           The interest-setter address
     */
    function getMarketInterestSetter(
        uint256 marketId
    )
        public
        view
        returns (IInterestSetter)
    {coverage_0x3f6d772c(0x0120cfdc621312fc346d235d514c569e73ff5076af0a458d237b7c0777b9d846); /* function */ 

coverage_0x3f6d772c(0x7300ed2bc02e85ab35ce3c5864fa5ba39a7ff390cc451eae570184f82fb6c48a); /* line */ 
        coverage_0x3f6d772c(0x5fce4754bdf001e8bc3d67570c1f2820943a6bcfdd98c91a35b7bcf724c617c4); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x10599ecf5928bc28217dcbb49bf043383d2388e6677930ee59ced52245f8bd26); /* line */ 
        coverage_0x3f6d772c(0x80fb13188f52857a522141aebebab0bfdccfc3d1f19fb926ffd966bb86ef20a3); /* statement */ 
return g_state.markets[marketId].interestSetter;
    }

    /**
     * Get the margin premium for a market. A margin premium makes it so that any positions that
     * include the market require a higher collateralization to avoid being liquidated.
     *
     * @param  marketId  The market to query
     * @return           The market's margin premium
     */
    function getMarketMarginPremium(
        uint256 marketId
    )
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0x8f5b771e4a4d438f3ca2096f8d649714a8525ab0cbd9390ba45a5e9a53dde0ec); /* function */ 

coverage_0x3f6d772c(0x5ef3d267c8e06bd41955ad7be225582619bfd12774caa3050aa3702f5a77498f); /* line */ 
        coverage_0x3f6d772c(0x282ea1cc37628008fc5c30b4f057243d3527636ac9df7a768521e170254c3d1b); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x30c68c470995b745178fdbe568906d1c475d798a1bfd494f09055bf1215f2ae4); /* line */ 
        coverage_0x3f6d772c(0x2de7b32b495e8e0714bd1a7f1a48800b5f528591a8111fd5e61443f8a463ab5e); /* statement */ 
return g_state.markets[marketId].marginPremium;
    }

    /**
     * Get the spread premium for a market. A spread premium makes it so that any liquidations
     * that include the market have a higher spread than the global default.
     *
     * @param  marketId  The market to query
     * @return           The market's spread premium
     */
    function getMarketSpreadPremium(
        uint256 marketId
    )
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0xf5151b184454f2ab39b50c4f65dd318edbad3c0ed8db62dc29027a4f6cc63079); /* function */ 

coverage_0x3f6d772c(0x622c9e59fa5faf2b48418a16feffad9c0c515b2aebd6d9d9baaf8d27324171f3); /* line */ 
        coverage_0x3f6d772c(0x990f9aaef8a318e327daebc879af03710a027060a40437764433cf70131c16bc); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x97073f1988d1c4c76278de54fdfa863e0c2bba5279909444caafa80ee24700ee); /* line */ 
        coverage_0x3f6d772c(0xfe3ab5229061ce777d74378167c6a9116dbe1ff1eb77d7f7c38002554e788c85); /* statement */ 
return g_state.markets[marketId].spreadPremium;
    }

    /**
     * Return true if a particular market is in closing mode. Additional borrows cannot be taken
     * from a market that is closing.
     *
     * @param  marketId  The market to query
     * @return           True if the market is closing
     */
    function getMarketIsClosing(
        uint256 marketId
    )
        public
        view
        returns (bool)
    {coverage_0x3f6d772c(0x59022fff009cd17be8b2f94aa7df23de9e8174ec3cafdb74eb48631eac908f79); /* function */ 

coverage_0x3f6d772c(0x40ec24c3a608515c09b4d951ddad204fef7e413074a8f1da905bc4fa3c4e05b9); /* line */ 
        coverage_0x3f6d772c(0xfeba00fb7818644677fb4082a548ba31e109e62a23c6fe638baa7c35a733541f); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x3b1e3a31136e4c444383e8bcf7588c7a42ad58921d4e4713ee35dbe92b51975d); /* line */ 
        coverage_0x3f6d772c(0x12d498ee9f6d2083d3492819dd102d7c36c3ff4572c01d0f3ea822f143e3fcb1); /* statement */ 
return g_state.markets[marketId].isClosing;
    }

    /**
     * Get the price of the token for a market.
     *
     * @param  marketId  The market to query
     * @return           The price of each atomic unit of the token
     */
    function getMarketPrice(
        uint256 marketId
    )
        public
        view
        returns (Monetary.Price memory)
    {coverage_0x3f6d772c(0xce7d9d028ca0a454cf45fc78ffeeeb2faaa820fa4633e38704fc59472f550f21); /* function */ 

coverage_0x3f6d772c(0xb30b2195ad139091c14e326cb746dd7838117599b8d3d186a1f8b2774d15a308); /* line */ 
        coverage_0x3f6d772c(0x399c3f865d029d4ce66d9b5fc1cdcd2ebc6f17ae331f9684f044aaa74ea902f0); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xc989a9e784d704dc95dd1ac007adecbb454bef690ed3c47d42e00c09cb3a6d4e); /* line */ 
        coverage_0x3f6d772c(0xccd73add2d4c9c127a1374ecf079fab7aca762383572e300480b39ed011bb137); /* statement */ 
return g_state.fetchPrice(marketId);
    }

    /**
     * Get the current borrower interest rate for a market.
     *
     * @param  marketId  The market to query
     * @return           The current interest rate
     */
    function getMarketInterestRate(
        uint256 marketId
    )
        public
        view
        returns (Interest.Rate memory)
    {coverage_0x3f6d772c(0x950d06cd2fc22ea2206b334ac6308e6fde3dbd6798c1f2d064c37a400d389f5c); /* function */ 

coverage_0x3f6d772c(0xa0a9c719ecba5b21d7be9d66fa73599e51b272bd83e64302a7a1c5a5c22883a8); /* line */ 
        coverage_0x3f6d772c(0xe2cae90509607357c8b15591d83ea7cd539c1f978638d9e13614212eb7afde56); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xe4aba342447b59a72c9407cf2c229d8b4ed8ea8e1c3f7904e558c02ac1df5c4d); /* line */ 
        coverage_0x3f6d772c(0xd0baf4b8463a756fb3835441da706a3346fba9996b6a93103dcb008af3b0ba9f); /* statement */ 
return g_state.fetchInterestRate(
            marketId,
            g_state.getIndex(marketId)
        );
    }

    /**
     * Get the adjusted liquidation spread for some market pair. This is equal to the global
     * liquidation spread multiplied by (1 + spreadPremium) for each of the two markets.
     *
     * @param  heldMarketId  The market for which the account has collateral
     * @param  owedMarketId  The market for which the account has borrowed tokens
     * @return               The adjusted liquidation spread
     */
    function getLiquidationSpreadForPair(
        uint256 heldMarketId,
        uint256 owedMarketId
    )
        public
        view
        returns (Decimal.D256 memory)
    {coverage_0x3f6d772c(0xa7f3c0cff1e8f4d8ec38ac3b333076b85d3768f4b56dff3fa59d132fcbf87a18); /* function */ 

coverage_0x3f6d772c(0x567a1fe2a8f989e3f7c2b4edeaa5ab35c61374b3c2e9c6cc209775603cf24e85); /* line */ 
        coverage_0x3f6d772c(0xf8a553b5a2eb14f03b28a818bd6b3ea505efeb51afbc83ab5443b5b652746008); /* statement */ 
_requireValidMarket(heldMarketId);
coverage_0x3f6d772c(0xf74300dccca5405a326826cdc3483d06bc9ca01cd98d0aaa7ffac4c9e7486b99); /* line */ 
        coverage_0x3f6d772c(0x5fc8c423480356f547979eb6f190d3709f21e4dcfb6d522ddf5598c8d40521df); /* statement */ 
_requireValidMarket(owedMarketId);
coverage_0x3f6d772c(0xbd598d681d31fca06115b4671337a350344c8d142f2abd6580332444e0cdc517); /* line */ 
        coverage_0x3f6d772c(0x138c678961e81a87b71d1beb580b82ef387b35d0cc75db64d90878cb0cb5b278); /* statement */ 
return g_state.getLiquidationSpreadForPair(heldMarketId, owedMarketId);
    }

    /**
     * Get basic information about a particular market.
     *
     * @param  marketId  The market to query
     * @return           A Storage.Market struct with the current state of the market
     */
    function getMarket(
        uint256 marketId
    )
        public
        view
        returns (Storage.Market memory)
    {coverage_0x3f6d772c(0x39b87245e97c3052dff4f05b5296b3f80e3f4f2429d802da4cd6511fd48f4049); /* function */ 

coverage_0x3f6d772c(0xe26d7e84895e0530db706ceb81b0c67632bb6eca6997498f15c329d1b9070912); /* line */ 
        coverage_0x3f6d772c(0x4793324bf454e7f6597630a11d824138843da21162971fe231f4095f8aa20dfc); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x591a3cd0e017e9972aebea9723e609556fcf1d6bbdf068c6dfff343b92f5cb39); /* line */ 
        coverage_0x3f6d772c(0xbe428b833664394d1aef6b6dd43cb24a81f6e1f49f8ff35793d2f9b07b92e476); /* statement */ 
return g_state.markets[marketId];
    }

    /**
     * Get comprehensive information about a particular market.
     *
     * @param  marketId  The market to query
     * @return           A tuple containing the values:
     *                    - A Storage.Market struct with the current state of the market
     *                    - The current estimated interest index
     *                    - The current token price
     *                    - The current market interest rate
     */
    function getMarketWithInfo(
        uint256 marketId
    )
        public
        view
        returns (
            Storage.Market memory,
            Interest.Index memory,
            Monetary.Price memory,
            Interest.Rate memory
        )
    {coverage_0x3f6d772c(0x70ba9f712f5f84f92febd090427c01ad7dffaff0a5b44df488d41b984c654b96); /* function */ 

coverage_0x3f6d772c(0xd6645475fff5375cd6ead7ec289162565a45446b4d911cac96214384ce07b577); /* line */ 
        coverage_0x3f6d772c(0xb9275a338a15b7de0e1fe725bcf8d43ad3e8c44cd3814312852e60184c5ee432); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xbcda7add62164075b8a5c64d07fd3ed5d5998898dc224247b63809f759bbeb0d); /* line */ 
        coverage_0x3f6d772c(0xa98620a4ae7793390d6e43c718d8d2bc343bce406a4661db2ba8fe93c905a84e); /* statement */ 
return (
            getMarket(marketId),
            getMarketCurrentIndex(marketId),
            getMarketPrice(marketId),
            getMarketInterestRate(marketId)
        );
    }

    /**
     * Get the number of excess tokens for a market. The number of excess tokens is calculated
     * by taking the current number of tokens held in Solo, adding the number of tokens owed to Solo
     * by borrowers, and subtracting the number of tokens owed to suppliers by Solo.
     *
     * @param  marketId  The market to query
     * @return           The number of excess tokens
     */
    function getNumExcessTokens(
        uint256 marketId
    )
        public
        view
        returns (Types.Wei memory)
    {coverage_0x3f6d772c(0x7307ca6c11fb39ee7a5337992adbaee7e29e9c93fa846ba06ef7f994712bd5bb); /* function */ 

coverage_0x3f6d772c(0x3fd8e54db642067fbf3ead26b7d29993e4dfbcab09ffb853b3b0e3951f04933f); /* line */ 
        coverage_0x3f6d772c(0x666ec56bba755ec665e6fb204291ebbffda6a9753b765b85b6b62ab689387184); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0xb89b6885e6722af307337ea6c65857783d736d4ea0b5b6cf9b5346bd73c220a4); /* line */ 
        coverage_0x3f6d772c(0x4ee21940ea492e1cc5beea7cf2c43e70b01076698b00c3cd13f2454b431bb59f); /* statement */ 
return g_state.getNumExcessTokens(marketId);
    }

    // ============ Getters for Accounts ============

    /**
     * Get the principal value for a particular account and market.
     *
     * @param  account   The account to query
     * @param  marketId  The market to query
     * @return           The principal value
     */
    function getAccountPar(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Par memory)
    {coverage_0x3f6d772c(0x8ce5be9f3fbb9d02e8e3996370e810ccc68651fcad21edb7cd760fad4b10b012); /* function */ 

coverage_0x3f6d772c(0x1b25b6c839e023f0050ee23a0307f17b8b73947b933fb19bf90ee523f4e89208); /* line */ 
        coverage_0x3f6d772c(0xe63a0b520eec16460c4de77bc11860892468f107ea6d11ed55b2c60bb39fc23c); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x487ed2451d86e9da1369e221c007e6df5c58259e4410dd5bda089405de639f9f); /* line */ 
        coverage_0x3f6d772c(0xd0de4d45893bd558525225a70f1717718a633069987fb42419fb09ff0694fd51); /* statement */ 
return g_state.getPar(account, marketId);
    }

    /**
     * Get the token balance for a particular account and market.
     *
     * @param  account   The account to query
     * @param  marketId  The market to query
     * @return           The token amount
     */
    function getAccountWei(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (Types.Wei memory)
    {coverage_0x3f6d772c(0x8341b7f7e76ace37bec87747889ff76f363f9aa2e0c54881c069bbd430600723); /* function */ 

coverage_0x3f6d772c(0xa11d12ec59ff073b986832c56065b168a9ac56ba93ac3f00a7873191bed065e6); /* line */ 
        coverage_0x3f6d772c(0x0c8f45c75c2a046e18a676b04bdaf437c0bdffb4475fc7d9245f17df115ae7fa); /* statement */ 
_requireValidMarket(marketId);
coverage_0x3f6d772c(0x4ba581a229792d38bcefe4f937ca397c5bb97f0e2d3f61ce2c3c5c2606669696); /* line */ 
        coverage_0x3f6d772c(0x0945f535b1a6de4e858dcee99ef8d2551a200153e08ce6666a5c6bb2b723087d); /* statement */ 
return Interest.parToWei(
            g_state.getPar(account, marketId),
            g_state.fetchNewIndex(marketId, g_state.getIndex(marketId))
        );
    }

    /**
     * Get the status of an account (Normal, Liquidating, or Vaporizing).
     *
     * @param  account  The account to query
     * @return          The account's status
     */
    function getAccountStatus(
        Account.Info memory account
    )
        public
        view
        returns (Account.Status)
    {coverage_0x3f6d772c(0xa33be6fd174e2e420bbd4c27d6b528b5c6674978cced430e368417d3411335e3); /* function */ 

coverage_0x3f6d772c(0xd272d14c62eccc12906750fc7fc37c969111831506681efbe447f48434a29712); /* line */ 
        coverage_0x3f6d772c(0x70259bc6acff1072bf54b4d3927f6707f40e717c971c4c9ad0c7312c4504ef31); /* statement */ 
return g_state.getStatus(account);
    }

    /**
     * Get the total supplied and total borrowed value of an account.
     *
     * @param  account  The account to query
     * @return          The following values:
     *                   - The supplied value of the account
     *                   - The borrowed value of the account
     */
    function getAccountValues(
        Account.Info memory account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {coverage_0x3f6d772c(0x0f546b9186d31eaa788965f3205fb79c11840ea672e1b5fa85f1f8104848620f); /* function */ 

coverage_0x3f6d772c(0x472ca3eef6ea2abfa3648bc2f4b649756197682751148f152a1dd3778045423b); /* line */ 
        coverage_0x3f6d772c(0x24a7ba264f8027849f05a9077ecb6a3ad04bdf155e849ef50ccffabc4e2830bd); /* statement */ 
return getAccountValuesInternal(account, /* adjustForLiquidity = */ false);
    }

    /**
     * Get the total supplied and total borrowed values of an account adjusted by the marginPremium
     * of each market. Supplied values are divided by (1 + marginPremium) for each market and
     * borrowed values are multiplied by (1 + marginPremium) for each market. Comparing these
     * adjusted values gives the margin-ratio of the account which will be compared to the global
     * margin-ratio when determining if the account can be liquidated.
     *
     * @param  account  The account to query
     * @return          The following values:
     *                   - The supplied value of the account (adjusted for marginPremium)
     *                   - The borrowed value of the account (adjusted for marginPremium)
     */
    function getAdjustedAccountValues(
        Account.Info memory account
    )
        public
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {coverage_0x3f6d772c(0x1d16ea9d062a71a85683970181d0947c292fcda99ab7465245dfad28f7b7d338); /* function */ 

coverage_0x3f6d772c(0x095b2932934a20b439d570e0bf558d226e41504962e2a7e5602b9122db6e0200); /* line */ 
        coverage_0x3f6d772c(0x0b8b789a25f12ea0185847b7eebfb23aeb18a97b7d69811e2476e777dd547471); /* statement */ 
return getAccountValuesInternal(account, /* adjustForLiquidity = */ true);
    }

    /**
     * Get an account's summary for each market.
     *
     * @param  account  The account to query
     * @return          The following values:
     *                   - The ERC20 token address for each market
     *                   - The account's principal value for each market
     *                   - The account's (supplied or borrowed) number of tokens for each market
     */
    function getAccountBalances(
        Account.Info memory account
    )
        public
        view
        returns (
            address[] memory,
            Types.Par[] memory,
            Types.Wei[] memory
        )
    {coverage_0x3f6d772c(0xac8324c711f3f67de21f7507625f358e560c74df14eec03fa041986f6f0d140c); /* function */ 

coverage_0x3f6d772c(0xa303f02944b3e3dfadee5e4ac9c2ca2da764721bbf3ede952f892421b2e79b78); /* line */ 
        coverage_0x3f6d772c(0x711544551d2d9b4e80b9785cc822bb17057138306a35e03d19aca788026915fe); /* statement */ 
uint256 numMarkets = g_state.numMarkets;
coverage_0x3f6d772c(0x5a7d125a3e1888630823dbcef5ad14deb692d880e4d9f769f793e1835515f836); /* line */ 
        coverage_0x3f6d772c(0xa7cf22bbd236040b5aacfd2ddcbe395eecd939669ed6f8dca7f7659358854240); /* statement */ 
address[] memory tokens = new address[](numMarkets);
coverage_0x3f6d772c(0x4d263eb8844a5bfc4bb0901f4e6b4c5c8419147cc50098f890c93e6b1de94c72); /* line */ 
        coverage_0x3f6d772c(0x85af7dead6dc5afb1c3890989a6e2dfb90d0d0de69a0cf826b0b50f8a82cb9e5); /* statement */ 
Types.Par[] memory pars = new Types.Par[](numMarkets);
coverage_0x3f6d772c(0x3f645519986476ef33e6270c4b24a0aff91068fcc4f5bec343bcda01d457b621); /* line */ 
        coverage_0x3f6d772c(0xec9fb5670070ae55c74143f6270c32d79f828dec597d8649f5c5b12a155cd329); /* statement */ 
Types.Wei[] memory weis = new Types.Wei[](numMarkets);

coverage_0x3f6d772c(0xd87e9f2fab543ec4b94cfad6418db5369abbd98e90441f21d40b56a122109a36); /* line */ 
        coverage_0x3f6d772c(0xa6917941050dcb5991ce5540814909e33d03af12d2523d2c6204f521e03eaafa); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x3f6d772c(0xc768ec53481435d763891b1892530b2c10cc09f283e82516a66af603260a969e); /* line */ 
            coverage_0x3f6d772c(0xef48d16401dc47684de1d519c0024aa5898b1e2c0ae6f8bc9a7480278153a8c3); /* statement */ 
tokens[m] = getMarketTokenAddress(m);
coverage_0x3f6d772c(0x67f3db07fa13547e6dda956f82b5ea8e2d281fc7f13bcb383fc82ce43adc42e1); /* line */ 
            coverage_0x3f6d772c(0x5707216541dd7255793bccb769492fee3eae57cbfb830539977a3cba78b9d180); /* statement */ 
pars[m] = getAccountPar(account, m);
coverage_0x3f6d772c(0x217241bdb2520c0c09f18c7707152184a08fcc47ac1d4344671c9ca1d69a6a9f); /* line */ 
            coverage_0x3f6d772c(0x8ddc0404f5ce6f23b47e12eda4298bdfc661a1a9233b7776d6c668283a90a229); /* statement */ 
weis[m] = getAccountWei(account, m);
        }

coverage_0x3f6d772c(0xbfa17ce52138970298ebf27c10588b44d55248573eaa67b1bcdf40f884e5154c); /* line */ 
        coverage_0x3f6d772c(0xeb6939bfa14aef4bcdbbd30acb5fbe713118beefef223ce0c8d6a241a0d1b6c4); /* statement */ 
return (
            tokens,
            pars,
            weis
        );
    }

    // ============ Getters for Permissions ============

    /**
     * Return true if a particular address is approved as an operator for an owner's accounts.
     * Approved operators can act on the accounts of the owner as if it were the operator's own.
     *
     * @param  owner     The owner of the accounts
     * @param  operator  The possible operator
     * @return           True if operator is approved for owner's accounts
     */
    function getIsLocalOperator(
        address owner,
        address operator
    )
        public
        view
        returns (bool)
    {coverage_0x3f6d772c(0xc5b27199a5cd5fb1d787fe52e78f15d04d2ffea2a3a39347d1568601fad797f9); /* function */ 

coverage_0x3f6d772c(0xb7204715bb58d4a203044da81470bf729def07df1053875939c033954ac73e4b); /* line */ 
        coverage_0x3f6d772c(0x3794afb015085c54a7b11e194a454bdcb84f03a3bd8e78bbbc1dd88ad2558faa); /* statement */ 
return g_state.isLocalOperator(owner, operator);
    }

    /**
     * Return true if a particular address is approved as a global operator. Such an address can
     * act on any account as if it were the operator's own.
     *
     * @param  operator  The address to query
     * @return           True if operator is a global operator
     */
    function getIsGlobalOperator(
        address operator
    )
        public
        view
        returns (bool)
    {coverage_0x3f6d772c(0x6e0552aec6dc18f5dadf4eaa1382b149c9d8741be63adc2861643f4fc24e3bfd); /* function */ 

coverage_0x3f6d772c(0xf55b5f075c10c436ea8712d562f8eb94f5b45a362b6b9a9c1b65f3248111c86d); /* line */ 
        coverage_0x3f6d772c(0xbef9a93272034c2a0900025a77ecd4a2c1970d2ff9e3bb785ec330d7777b937e); /* statement */ 
return g_state.isGlobalOperator(operator);
    }

    // ============ Private Helper Functions ============

    /**
     * Revert if marketId is invalid.
     */
    function _requireValidMarket(
        uint256 marketId
    )
        private
        view
    {coverage_0x3f6d772c(0x33fb365dea760feb8bec65c39deb29ae0420520996293567ef9b4fe39ea903f2); /* function */ 

coverage_0x3f6d772c(0x368d005a2ea2779863d812093af1298d9ab112ad3ac3e99db32fde707eb16c30); /* line */ 
        coverage_0x3f6d772c(0x275cedbf500749b780a1d4cb289169ad61f3f276ab7f95b112965f5eed6051f2); /* statement */ 
Require.that(
            marketId < g_state.numMarkets,
            FILE,
            "Market OOB"
        );
    }

    function _requireValidToken(
        address token
    )
        private
        view
    {coverage_0x3f6d772c(0x5018e14456504049e8c42bffadaabcdd8e4e6badd7ad36f70d306db0d3442745); /* function */ 

coverage_0x3f6d772c(0x501515eb2b44b03f604092d3bb7dd600ec48231e3884cd9a108a26b1a0a49989); /* line */ 
        coverage_0x3f6d772c(0x5ab6dfaa7221278d00b337052bb9234e41500329bb551056bdab72ac0e4ca1ec); /* statement */ 
Require.that(
            token == g_state.markets[g_state.tokenToMarketId[token]].token,
            FILE,
            "Invalid token"
        );
    }

    /**
     * Private helper for getting the monetary values of an account.
     */
    function getAccountValuesInternal(
        Account.Info memory account,
        bool adjustForLiquidity
    )
        private
        view
        returns (Monetary.Value memory, Monetary.Value memory)
    {coverage_0x3f6d772c(0x288a19ce2e7f1ce8b1fece7a2eeea9688a62b7bc5f1fb4c5e0e1944b33ba55ed); /* function */ 

coverage_0x3f6d772c(0x30dc6167e3f01ba147a35b531a3a15fdb60ec0f39b427838a7aaaee5b1573efe); /* line */ 
        coverage_0x3f6d772c(0xe7803af57bef9d38b1d1788c2d3008f0b881d1aa60d61d3d612e7f8229190b43); /* statement */ 
uint256 numMarkets = g_state.numMarkets;

        // populate cache
coverage_0x3f6d772c(0x07e0234b9cf718c2011f584a6b667fdb9eb3da2fcb375cd6af9b6edc7693f99f); /* line */ 
        coverage_0x3f6d772c(0xd43373869f9ce1204ae456cb26ded1397b7de714e5ece20c38d322e97f5498d2); /* statement */ 
Cache.MarketCache memory cache = Cache.create(numMarkets);
coverage_0x3f6d772c(0xbb25b86ba7dba9a1c957258d94dc841876f03b3fe17a696299affcde87bf580a); /* line */ 
        coverage_0x3f6d772c(0x332b7c897fa6cb3e60c9994c3b9a09f15b1769b148334516f4d750ea002335aa); /* statement */ 
for (uint256 m = 0; m < numMarkets; m++) {
coverage_0x3f6d772c(0x662131d5807fc82a1df19954d4d887154f2736bfd0ab650879b675d7a86aa4fe); /* line */ 
            coverage_0x3f6d772c(0x926eacb4976e0ddd150ed0beeba801765e3b2e83a6c235e75073529459b3751e); /* statement */ 
if (!g_state.getPar(account, m).isZero()) {coverage_0x3f6d772c(0x30e67dcad604169676ccfec443d092d1ae70992dc530acd0b6b5b3ffd2b5c574); /* branch */ 

coverage_0x3f6d772c(0x60884a008eb6869de4e5712155209a35daa30227e1b9e4bec30dfa2d5f6c8c86); /* line */ 
                coverage_0x3f6d772c(0xc56e844a2fbf02ddb493ccac24de108801596b995bab5f6aba47e5d8e2030524); /* statement */ 
cache.addMarket(g_state, m);
            }else { coverage_0x3f6d772c(0x63d574954958c6a22fdcc4b8a5394b5ea218a6ca3f7392f057108a934dcc8673); /* branch */ 
}
        }

coverage_0x3f6d772c(0xc37599e0f5d9aae5d91cd9b114be25ef86d8fd06c2f0d4363759015d2226c2dd); /* line */ 
        coverage_0x3f6d772c(0x74a4c9e28761b2b8b46acdcecc02f09a3495eb34ec4ffa1f6bdb2db316f7b2b9); /* statement */ 
return g_state.getAccountValues(account, cache, adjustForLiquidity);
    }
}
