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

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import { State } from "./State.sol";
import { AdminImpl } from "./impl/AdminImpl.sol";
import { IInterestSetter } from "./interfaces/IInterestSetter.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { Decimal } from "./lib/Decimal.sol";
import { Interest } from "./lib/Interest.sol";
import { Monetary } from "./lib/Monetary.sol";
import { Token } from "./lib/Token.sol";


/**
 * @title Admin
 * @author dYdX
 *
 * Public functions that allow the privileged owner address to manage Solo
 */
contract Admin is
    State,
    Ownable,
    ReentrancyGuard
{
function coverage_0x9602ff99(bytes32 c__0x9602ff99) public pure {}

    // ============ Token Functions ============

    /**
     * Withdraw an ERC20 token for which there is an associated market. Only excess tokens can be
     * withdrawn. The number of excess tokens is calculated by taking the current number of tokens
     * held in Solo, adding the number of tokens owed to Solo by borrowers, and subtracting the
     * number of tokens owed to suppliers by Solo.
     */
    function ownerWithdrawExcessTokens(
        uint256 marketId,
        address recipient
    )
        public
        onlyOwner
        nonReentrant
        returns (uint256)
    {coverage_0x9602ff99(0x4db91ca32d62aa43db9af7cf548a3902f84fb008b4958cd37e287dd3658171cc); /* function */ 

coverage_0x9602ff99(0x30f7cd99bb8fff3b489ab7f73c016a3f23664c19558211f51e5ded932f967fbc); /* line */ 
        coverage_0x9602ff99(0xf3602209eb4020725e0328fed5076c8388afca0734c5f06b7c1d03974e43da09); /* statement */ 
return AdminImpl.ownerWithdrawExcessTokens(
            g_state,
            marketId,
            recipient
        );
    }

    /**
     * Withdraw an ERC20 token for which there is no associated market.
     */
    function ownerWithdrawUnsupportedTokens(
        address token,
        address recipient
    )
        public
        onlyOwner
        nonReentrant
        returns (uint256)
    {coverage_0x9602ff99(0x8b1a136089c3d073bb6a92b5f661f2ab4256dd879bf5615f79bd1f1c155f2651); /* function */ 

coverage_0x9602ff99(0x8a0d4df8cafb4bf18c81606104dba6345de06c46f14ab74936e8f377726e64fe); /* line */ 
        coverage_0x9602ff99(0xdff90c4915d3d04ece34b500a6a6d623934f7b4c1486e4b91c7cfc9e8e7f05d7); /* statement */ 
return AdminImpl.ownerWithdrawUnsupportedTokens(
            g_state,
            token,
            recipient
        );
    }

    // ============ Market Functions ============

    /**
     * Add a new market to Solo. Must be for a previously-unsupported ERC20 token.
     */
    function ownerAddMarket(
        address token,
        IPriceOracle priceOracle,
        IInterestSetter interestSetter,
        Decimal.D256 memory marginPremium,
        Decimal.D256 memory spreadPremium,
        bool isClosing
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x06b925e186a1403ac2bb6c202fe27075a75aa0ed6b3658119f388e4054f8b9fd); /* function */ 

coverage_0x9602ff99(0xa6674f3604d0cfa1e249f82bd67b2636d825f839905c6a7afd01c94b99df21d0); /* line */ 
        coverage_0x9602ff99(0xe50fac8cb6bdb2264d2774cad790ff06662abe2a47c3d4dea20fb8559ab4b465); /* statement */ 
AdminImpl.ownerAddMarket(
            g_state,
            token,
            priceOracle,
            interestSetter,
            marginPremium,
            spreadPremium,
            isClosing
        );
    }

    /**
     * Set (or unset) the status of a market to "closing". The borrowedValue of a market cannot
     * increase while its status is "closing".
     */
    function ownerSetIsClosing(
        uint256 marketId,
        bool isClosing
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x067f56435d0cea050d09841fd7ceb65f6211258de8bd777e35f1a36c87eeb4ae); /* function */ 

coverage_0x9602ff99(0x0b91aadb8c67b69a062ccab16fd48c275b7ff7722bf49c7cfcfaac7d78208607); /* line */ 
        coverage_0x9602ff99(0x1e80f00863cd8a92210d46c412ae4ed6e97d312add20923d0c4d83a6e4d8c82d); /* statement */ 
AdminImpl.ownerSetIsClosing(
            g_state,
            marketId,
            isClosing
        );
    }

    /**
     * Set the price oracle for a market.
     */
    function ownerSetPriceOracle(
        uint256 marketId,
        IPriceOracle priceOracle
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0xdcc1372e6cf9d4e6bd26986f49793b27f785e22d2619e6e19ed37151e4001a5b); /* function */ 

coverage_0x9602ff99(0xf29eaf818f22ee51fd1a537678615444563d6d0c0c4a112bef0b9ce3246c8e0a); /* line */ 
        coverage_0x9602ff99(0xae797ed44c41dcc255a5eb9d55164c8c8b83549c6e88600f66f19cd4c52f7c15); /* statement */ 
AdminImpl.ownerSetPriceOracle(
            g_state,
            marketId,
            priceOracle
        );
    }

    /**
     * Set the interest-setter for a market.
     */
    function ownerSetInterestSetter(
        uint256 marketId,
        IInterestSetter interestSetter
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x27cee89de52f445eda7839bd1c47efb3c8d03fea84825e22f82dd232462b7db7); /* function */ 

coverage_0x9602ff99(0xd7f1a3cf6b454604211c3aba0f946edd14a45885fb2f39b89cbe53714a345caa); /* line */ 
        coverage_0x9602ff99(0xfeb8ded3105c66e7f613ed9a6c592aea3adc6db8e9cc00adaa3f767d11dcb9d0); /* statement */ 
AdminImpl.ownerSetInterestSetter(
            g_state,
            marketId,
            interestSetter
        );
    }

    /**
     * Set a premium on the minimum margin-ratio for a market. This makes it so that any positions
     * that include this market require a higher collateralization to avoid being liquidated.
     */
    function ownerSetMarginPremium(
        uint256 marketId,
        Decimal.D256 memory marginPremium
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x5be9b1a0c4f4d853935eb9f8c3bb0494aed9c1b0ae70bbf02f3730abf57f76b8); /* function */ 

coverage_0x9602ff99(0x3e1a8f14512b76ba556775bf4728ba3c203ac59458058ac2721a3df6309ed92e); /* line */ 
        coverage_0x9602ff99(0x4afc673b7546da0a43097488e0ead25cf133ed9ac9d5709478e8a6b723b00748); /* statement */ 
AdminImpl.ownerSetMarginPremium(
            g_state,
            marketId,
            marginPremium
        );
    }

    /**
     * Set a premium on the liquidation spread for a market. This makes it so that any liquidations
     * that include this market have a higher spread than the global default.
     */
    function ownerSetSpreadPremium(
        uint256 marketId,
        Decimal.D256 memory spreadPremium
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x823658beae1b5d99bdd47dd0cd7fc619aaceb9742b2166a8926b81ae61fb1d34); /* function */ 

coverage_0x9602ff99(0xc7a99d9d54270fd58bb9785cc7a2124e9a20570b2251c2abae98997aeaf205bf); /* line */ 
        coverage_0x9602ff99(0x8b60a5b67e9afed3be899f073a8681468a607d14a920b009442212fcd69b03b3); /* statement */ 
AdminImpl.ownerSetSpreadPremium(
            g_state,
            marketId,
            spreadPremium
        );
    }

    // ============ Risk Functions ============

    /**
     * Set the global minimum margin-ratio that every position must maintain to prevent being
     * liquidated.
     */
    function ownerSetMarginRatio(
        Decimal.D256 memory ratio
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x357dd686ed43e7799de6a336cb7200a5a8072d56859058992ef408cfb54d6fee); /* function */ 

coverage_0x9602ff99(0xf96f1ba47ab4c7691fb8a110acac019cdf3e49dcdffc5c8f3361db9d40451be0); /* line */ 
        coverage_0x9602ff99(0x3640c98c3bf5b79df8b8356181d1b664872b41e220abf25889b416c095548b18); /* statement */ 
AdminImpl.ownerSetMarginRatio(
            g_state,
            ratio
        );
    }

    /**
     * Set the global liquidation spread. This is the spread between oracle prices that incentivizes
     * the liquidation of risky positions.
     */
    function ownerSetLiquidationSpread(
        Decimal.D256 memory spread
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0xe48ea564fe26601d5abc47a2c71fed778a14044ebd3c9a3d57cfcbb9d8d81917); /* function */ 

coverage_0x9602ff99(0xdca03065514aa8f17353e83c3f4db441d2ef80941990123b2ea2c0617bbae163); /* line */ 
        coverage_0x9602ff99(0x861d7e386577ce89c786c21a2b97f9f087e8ed04dba1c65f85db35c83850f9eb); /* statement */ 
AdminImpl.ownerSetLiquidationSpread(
            g_state,
            spread
        );
    }

    /**
     * Set the global earnings-rate variable that determines what percentage of the interest paid
     * by borrowers gets passed-on to suppliers.
     */
    function ownerSetEarningsRate(
        Decimal.D256 memory earningsRate
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0x733b9e56855106c34249dc83fb5e7d0af81118ef1bba8b427bcd64e5d585861f); /* function */ 

coverage_0x9602ff99(0x24e9637e2f78b181126e2d248f8f2bf7e909b2116421bca13863078df9d61965); /* line */ 
        coverage_0x9602ff99(0xc4b90cfe586f8dc5b26f08bcfc766a69d69a316ff2c2dfc1fc51ef41ff8fe9e1); /* statement */ 
AdminImpl.ownerSetEarningsRate(
            g_state,
            earningsRate
        );
    }

    /**
     * Set the global minimum-borrow value which is the minimum value of any new borrow on Solo.
     */
    function ownerSetMinBorrowedValue(
        Monetary.Value memory minBorrowedValue
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0xa97d8b9ead2caef20676290c554f55efb61ac96a5c2c2404bcdf50b488cae331); /* function */ 

coverage_0x9602ff99(0xc9b5eb061bd27cd9e93a7b037affcf070313ebf30ee6b5673cf9bfc2ac4d67c6); /* line */ 
        coverage_0x9602ff99(0x285b28d3965c9fafadb54c4c4a8a32aef3e37cb38c61319451acdce7a31e7747); /* statement */ 
AdminImpl.ownerSetMinBorrowedValue(
            g_state,
            minBorrowedValue
        );
    }

    // ============ Global Operator Functions ============

    /**
     * Approve (or disapprove) an address that is permissioned to be an operator for all accounts in
     * Solo. Intended only to approve smart-contracts.
     */
    function ownerSetGlobalOperator(
        address operator,
        bool approved
    )
        public
        onlyOwner
        nonReentrant
    {coverage_0x9602ff99(0xfdfd09688c51d339cd757b2236bc1c333025b4e9d7b9fa6be876ca359b72deed); /* function */ 

coverage_0x9602ff99(0x66886e2b563af95fafaac9e68c1d983512fbfc8f30da08c6a18b75325eafa9eb); /* line */ 
        coverage_0x9602ff99(0xa1c7a5b7c616a74d3f492efbbcbedb0d94afbc7d8eab59839a3a4a61f3be2b13); /* statement */ 
AdminImpl.ownerSetGlobalOperator(
            g_state,
            operator,
            approved
        );
    }
}
