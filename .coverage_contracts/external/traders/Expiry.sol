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

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { ICallee } from "../../protocol/interfaces/ICallee.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Decimal } from "../../protocol/lib/Decimal.sol";
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Time } from "../../protocol/lib/Time.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";


/**
 * @title Expiry
 * @author dYdX
 *
 * Sets the negative balance for an account to expire at a certain time. This allows any other
 * account to repay that negative balance after expiry using any positive balance in the same
 * account. The arbitrage incentive is the same as liquidation in the base protocol.
 */
contract Expiry is
    Ownable,
    OnlySolo,
    ICallee,
    IAutoTrader
{
function coverage_0xf7de2292(bytes32 c__0xf7de2292) public pure {}

    using SafeMath for uint32;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "Expiry";

    // ============ Events ============

    event ExpirySet(
        address owner,
        uint256 number,
        uint256 marketId,
        uint32 time
    );

    event LogExpiryRampTimeSet(
        uint256 expiryRampTime
    );

    // ============ Storage ============

    // owner => number => market => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // time over which the liquidation ratio goes from zero to maximum
    uint256 public g_expiryRampTime;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 expiryRampTime
    )
        public
        OnlySolo(soloMargin)
    {coverage_0xf7de2292(0xc85404ad002a66e6bb7e07b7cbfc729bb5a15f4f8ae7002e573634c5bd3db4c8); /* function */ 

coverage_0xf7de2292(0x70833f43816b9d02313eabf7cfcf2c9f7581a02db4efa42fc91ba493926c407d); /* line */ 
        coverage_0xf7de2292(0x1e7a1645d077dc899fe67b550817ccdd9c2a42d6b2f9f6aea2edd9260f8bc391); /* statement */ 
g_expiryRampTime = expiryRampTime;
    }

    // ============ Admin Functions ============

    function ownerSetExpiryRampTime(
        uint256 newExpiryRampTime
    )
        external
        onlyOwner
    {coverage_0xf7de2292(0x9983b72a9a8fca5a16d9961eec2e0654bf0ca1be847b6331c55b324fbd2dba33); /* function */ 

coverage_0xf7de2292(0x2fede0b2ed68a1c643ac4c5fb9aea3ff7d9f47f0bdf2d36610032607e213d2ed); /* line */ 
        coverage_0xf7de2292(0x2807802b28ee5be34ce1754fa5ea15d881b6a18562923c0304f19f1a4886bdaf); /* statement */ 
emit LogExpiryRampTimeSet(newExpiryRampTime);
coverage_0xf7de2292(0x0cc75c9f6a33383e1e53ea2cb79d55773fa4e68f21c187717dd6736cf061d31a); /* line */ 
        coverage_0xf7de2292(0xaecfcbe0d568ea5bc5ec0ae8c3c909b2e04f40d095b5ece06b1aebe80dc10e7c); /* statement */ 
g_expiryRampTime = newExpiryRampTime;
    }

    // ============ Only-Solo Functions ============

    function callFunction(
        address /* sender */,
        Account.Info memory account,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {coverage_0xf7de2292(0x78c38bf9442abe9c6597e19d8f29f2218f2a4c4b9a8a0353041df3d88ae06569); /* function */ 

coverage_0xf7de2292(0x3852c7a8a04882e76ff8fc97c1c3626f9f4048c537cd0f46524d96f3f1def2c9); /* line */ 
        coverage_0xf7de2292(0x0cfb254e4c949f36986bff23996e306da86f35ed5b2b651f0604c3cded96a817); /* statement */ 
(
            uint256 marketId,
            uint32 expiryTime
        ) = parseCallArgs(data);

        // don't set expiry time for accounts with positive balance
coverage_0xf7de2292(0x9b6edc24bef9fa73663a1151625493d28a3bfe21083ecb77fb1fdc514042f138); /* line */ 
        coverage_0xf7de2292(0x28e42fa34a849b007abfffb9b88c2bcc086e5142c097169158a6185c6ac478a0); /* statement */ 
if (expiryTime != 0 && !SOLO_MARGIN.getAccountPar(account, marketId).isNegative()) {coverage_0xf7de2292(0x997f0136cf1eb8b03ec8a102a19ee20782d57202f528472bd8a1feb35f4d78f8); /* branch */ 

coverage_0xf7de2292(0x00d4e09c100354aba67b21531d3e3150d36448d02ead0d876266fdfafbe6018e); /* line */ 
            coverage_0xf7de2292(0x6b6da3ac56a24f90fcfc9a3e8517cb4a3a3bfca467c4ca9cd66cfd2ea4375fd8); /* statement */ 
return;
        }else { coverage_0xf7de2292(0x00a0a7c83806a12646e5227342fc325ceba11f405fb7698ab6343fb731db30bb); /* branch */ 
}

coverage_0xf7de2292(0xbfeaba1a4e81edcb74b2a352e26de60a1725e21cb98bdf24f28985b1edbca197); /* line */ 
        coverage_0xf7de2292(0x7c6756651ac337db636ee2ca2b24e0cbf0a2457bc112b9c3f333b2e94c43c261); /* statement */ 
setExpiry(account, marketId, expiryTime);
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory /* takerAccount */,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {coverage_0xf7de2292(0xb63853a2cf4b30fd2c093a12e153d6b84cddcd4cb98b2ebea1d43d6f7fa24c6c); /* function */ 

        // return zero if input amount is zero
coverage_0xf7de2292(0x38f999ec529055047b645ca1ebd490af0c5843167fee7e9d51b5f50241dbc75d); /* line */ 
        coverage_0xf7de2292(0x02cab5cf980949c38e7c1d9567863f124d4ad42fba1695af0e72d13ae51a4c66); /* statement */ 
if (inputWei.isZero()) {coverage_0xf7de2292(0xa75f3c9b6dc64cb1ac89542d31238deddd529950c3176936ba89149dd012e00f); /* branch */ 

coverage_0xf7de2292(0x8e601553070a8f1723e39bbeedb382b5c57eb2335c99189a8ad75fb16e33e0cf); /* line */ 
            coverage_0xf7de2292(0x1b80714e7e9e92e8edf47ab8815ec6e4047f49765126ebcb64d23fe2ddbae66a); /* statement */ 
return Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: 0
            });
        }else { coverage_0xf7de2292(0x54c4fc6b80b4fea5742c56893f4f076a5e573a787b6c7742b2c4c78a98d38ea7); /* branch */ 
}

coverage_0xf7de2292(0x4d3b00989caab57c93d19a2dceb2877a8eb73aa322b48ee567c97e9d29e0e097); /* line */ 
        coverage_0xf7de2292(0xb60b24827c4d9fa5c526f06657f74e0cec020fcf13f489afc4a7899f126df1b6); /* statement */ 
(
            uint256 owedMarketId,
            uint32 maxExpiry
        ) = parseTradeArgs(data);

coverage_0xf7de2292(0xa78b9f5c24b801cc08cf99382708e55e0924485c75a1ac7dda967ac5d3d30f5a); /* line */ 
        coverage_0xf7de2292(0xec76c2471c620115bbf65f6cbdbf8fa42325dce276e9515dc023f36755b98eef); /* statement */ 
uint32 expiry = getExpiry(makerAccount, owedMarketId);

        // validate expiry
coverage_0xf7de2292(0xa03dd4551b9bf6303d713c604f63dd98ce5fd9bb5d1d789b131deae81e2da953); /* line */ 
        coverage_0xf7de2292(0x9d41a70f581504835261be1b463bae3d5bc08aa7abe588d43063b32d55cf9317); /* statement */ 
Require.that(
            expiry != 0,
            FILE,
            "Expiry not set",
            makerAccount.owner,
            makerAccount.number,
            owedMarketId
        );
coverage_0xf7de2292(0xd2965724b8f4d61a0f4ec3abfa15c45ac114105514dbaf56b64fb556e66ff14e); /* line */ 
        coverage_0xf7de2292(0x36680b05e04dfe7d466c1ddb8d09f2bde621499d1e1574da3496a9244a0cd1c4); /* statement */ 
Require.that(
            expiry <= Time.currentTime(),
            FILE,
            "Borrow not yet expired",
            expiry
        );
coverage_0xf7de2292(0x145d291c345aadd4c46bd01d0a16c815ceeb78968bcf6d25a55b33ed3d872f8a); /* line */ 
        coverage_0xf7de2292(0x5389f8cb7fc4d192bc29c9fb3e7f2b5a983db5320cbc4158aa650d58932d2de8); /* statement */ 
Require.that(
            expiry <= maxExpiry,
            FILE,
            "Expiry past maxExpiry",
            expiry
        );

coverage_0xf7de2292(0xc5acac550821d2920aaa5fd7090517ae0438125522082dd4393f0dd4529a3956); /* line */ 
        coverage_0xf7de2292(0xc4200f776cb249d33987f81dce46ab0fd2053d208e12f8c42cc815ed0c424229); /* statement */ 
return getTradeCostInternal(
            inputMarketId,
            outputMarketId,
            makerAccount,
            oldInputPar,
            newInputPar,
            inputWei,
            owedMarketId,
            expiry
        );
    }

    // ============ Getters ============

    function getExpiry(
        Account.Info memory account,
        uint256 marketId
    )
        public
        view
        returns (uint32)
    {coverage_0xf7de2292(0x8ed88cd435917ab326c92519d81aa75cde984f5b732d181c2560304e12fb335e); /* function */ 

coverage_0xf7de2292(0xed5353dd4fcb04f995236e72f44a0fc9fdd94e34a96f8ef19ca7c2a4104806df); /* line */ 
        coverage_0xf7de2292(0x398dae924e83e2af9cd89920c6861d306ccaa01694ed8c649ef5dcb353e1113c); /* statement */ 
return g_expiries[account.owner][account.number][marketId];
    }

    function getSpreadAdjustedPrices(
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
    )
        public
        view
        returns (
            Monetary.Price memory,
            Monetary.Price memory
        )
    {coverage_0xf7de2292(0xbad9d63d17c87ca7c6565a08c30f711f669b119c8075acfe07ab493783150de5); /* function */ 

coverage_0xf7de2292(0x77d40a77674b8a396fe1703e6cbc098708cfadfebd3008f584de1aa78f2efb79); /* line */ 
        coverage_0xf7de2292(0x2dce4f4ca41a163c0b203b651ddebb1c110fcd606e52f8c2e479aff54e95ec4d); /* statement */ 
Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

coverage_0xf7de2292(0xae9239534d682011906a99d28f3b2bf2091b2027ece5a21c46566b6b762dcbf9); /* line */ 
        coverage_0xf7de2292(0xbada825743d8e02b3cad274bb33cfcc93d176329b29995cc48ab8a853a5ccffa); /* statement */ 
uint256 expiryAge = Time.currentTime().sub(expiry);

coverage_0xf7de2292(0x4c25c62db6a9df66224a6bcaed4056d951466659718836d58ca8eaeddd093754); /* line */ 
        coverage_0xf7de2292(0xa365d04a3433950cdd397827ee31c04a98f8bc10632df3da9b44841be69a8009); /* statement */ 
if (expiryAge < g_expiryRampTime) {coverage_0xf7de2292(0xc3ce8eb7a5379c83217f3990a4489b2489cdfe39399330fff17fd61db3f837b7); /* branch */ 

coverage_0xf7de2292(0x00f926aedb6449bae8af19d97fcffaba58f71d8585792f263821a62d6a099fc8); /* line */ 
            coverage_0xf7de2292(0xf555539800821be8cbb514e472d7d249f182ef3d38c985d26eaaa117f946be8e); /* statement */ 
spread.value = Math.getPartial(spread.value, expiryAge, g_expiryRampTime);
        }else { coverage_0xf7de2292(0x431ca7a74f1a494433a3cadf8c923046188455a0c3e9e9308378287e6c76f93d); /* branch */ 
}

coverage_0xf7de2292(0xe539d1450f01637f7e47c54595006f8b533d802ff98b4dfd5b2ada78cc267fa8); /* line */ 
        coverage_0xf7de2292(0xf40fa174e17496939ba2049b3a0ff1959ff6ff64d1c8af57a8c8c13f8993f945); /* statement */ 
Monetary.Price memory heldPrice = SOLO_MARGIN.getMarketPrice(heldMarketId);
coverage_0xf7de2292(0x263c5004b3ccd87f134805d80da4e8a2ed11338bf91ce8dd3d55aa5c48b2606e); /* line */ 
        coverage_0xf7de2292(0x409fdf11495e4e24c285c427cfec39a9b181f6ce655c58dee18c1a23cc937071); /* statement */ 
Monetary.Price memory owedPrice = SOLO_MARGIN.getMarketPrice(owedMarketId);
coverage_0xf7de2292(0x65220cefd88b7e805644e966202c0ade19a652e4f748d61fc1d9b93ff04722b1); /* line */ 
        coverage_0xf7de2292(0xbb130b6968d9bc318dcaea314e867be4d79585a9617b1fa613d779731fca49e2); /* statement */ 
owedPrice.value = owedPrice.value.add(Decimal.mul(owedPrice.value, spread));

coverage_0xf7de2292(0xe4caf86611bcbdee2c9bfe1729bc987153c199956daa40350cae493978cfc9dc); /* line */ 
        coverage_0xf7de2292(0xffac9cc86e628128f406d6a63043349030946eaebe84453c275663d5e8c7f476); /* statement */ 
return (heldPrice, owedPrice);
    }

    // ============ Private Functions ============

    function getTradeCostInternal(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        uint256 owedMarketId,
        uint32 expiry
    )
        private
        returns (Types.AssetAmount memory)
    {coverage_0xf7de2292(0xbbf89400894fea01e711d38f32206b41b50199a71a75b06a49c635c286b07e82); /* function */ 

coverage_0xf7de2292(0xf31e51b206ba88fafba4650970772efc3a998d5a2e721bf43ee98d1a6d100b89); /* line */ 
        coverage_0xf7de2292(0xf6152de8c1f951913bc4632aa93e16ee2ed934ad164cc18d6cffad9caac2cd68); /* statement */ 
Types.AssetAmount memory output;
coverage_0xf7de2292(0x9c38080856c81fd80fa7a7740a9de9ac9d63c370c838628fcbac1455d158b411); /* line */ 
        coverage_0xf7de2292(0x97e4c98e591aca9de55d51e0a5f1269f46c05a10faa6c690819d1890c32eb5bc); /* statement */ 
Types.Wei memory maxOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);

coverage_0xf7de2292(0xda043019c4c6d81fbc376000ad006a7ce40b93de2fbd79d9e33b91bf9e910f9d); /* line */ 
        coverage_0xf7de2292(0x4c46fecfc805616c293c348fa390c45e1f734bfb7355e5271833fb87acdc8605); /* statement */ 
if (inputWei.isPositive()) {coverage_0xf7de2292(0xcc0b1f795bbe5e04b6d0bc6b0d593a17bfd8e3cf78c71dd42b358ed4301cc3c9); /* branch */ 

coverage_0xf7de2292(0x44be880cfb1d5ef21043726a3fdbfbea1a30ec866d1e916abf775867e404e906); /* line */ 
            coverage_0xf7de2292(0x923bdf4719dcda2775c8ea6f2ebec584c30ac602cfadd9a79546ef7ffb333222); /* statement */ 
Require.that(
                inputMarketId == owedMarketId,
                FILE,
                "inputMarket mismatch",
                inputMarketId
            );
coverage_0xf7de2292(0x24f94bd89003299ed1482c4a3ba210bc1c827dffc1aff7fa0ecb0410b2e92c57); /* line */ 
            coverage_0xf7de2292(0x9b78e02ce77abe8da0d668b33b34f2bc43164d8de7643320a4a4bacfe1bd6f15); /* statement */ 
Require.that(
                !newInputPar.isPositive(),
                FILE,
                "Borrows cannot be overpaid",
                newInputPar.value
            );
coverage_0xf7de2292(0x5a10894b29fa0e63f61ce08f7bb69fb72ea4cab234165eb80b7c624cbdbc1f8e); /* line */ 
            coverage_0xf7de2292(0x1b03e2c4bd80db2957c756d52f3d5dbdcba4ad442c83199a7417080083d73af3); /* assertPre */ 
coverage_0xf7de2292(0x9c13cf75cebc05e7a723c445092d3dd953204c18621ffd85c0f8d062cf8ef3a1); /* statement */ 
assert(oldInputPar.isNegative());coverage_0xf7de2292(0xcc26193d6f40e885d554b43eeab1cc82e3cbba15969d2b1ee2162540a323cf6d); /* assertPost */ 

coverage_0xf7de2292(0x245f857de0d235f49c58534ca837cb46114c15e6c25461cf49a37efcf4692a30); /* line */ 
            coverage_0xf7de2292(0xf5b8a3de131c5d885ac5de6f187d10e54dd0959c0b1a755cfba46dfc29f355cb); /* statement */ 
Require.that(
                maxOutputWei.isPositive(),
                FILE,
                "Collateral must be positive",
                outputMarketId,
                maxOutputWei.value
            );
coverage_0xf7de2292(0x71856e0f1e490c2c1c74adaed464460b8c2a82a1646eaad2951866a1dbd35d26); /* line */ 
            coverage_0xf7de2292(0x77b84be57d10c923eb720cc43db6e087a1f1bfe9b409251d6b19b36a8090a9c2); /* statement */ 
output = owedWeiToHeldWei(
                inputWei,
                outputMarketId,
                inputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
coverage_0xf7de2292(0x41247c3a977f49b708f43486a847d767de88ee9d780c5d275881bf09dde38038); /* line */ 
            coverage_0xf7de2292(0x7ee5a1f53d23c87ad2b10677eff28ee4bd2a5421b273706f92220b348c7473fb); /* statement */ 
if (newInputPar.isZero()) {coverage_0xf7de2292(0x94411b48de0f92e606d8caf16cd104689dc317a48f872c742ba640813653cd6c); /* branch */ 

coverage_0xf7de2292(0xf873f26ef39ac2e0a7e8014bc49df8845fa97f358c9838b443c75c9b0c1fad63); /* line */ 
                coverage_0xf7de2292(0x764e4e411853130473566ca65293b635e9865ead80b95c0981d52a5b8e1c8e5b); /* statement */ 
setExpiry(makerAccount, owedMarketId, 0);
            }else { coverage_0xf7de2292(0x3a232c98d0fc39feeab5a48059ccbc83634387c36b8047261102f3ced907c8bb); /* branch */ 
}
        } else {coverage_0xf7de2292(0xfe31d9a4c122880fba4b34944688a1c447020297e8f245c9c5d1e8847967de54); /* branch */ 

coverage_0xf7de2292(0x7bb48ede23ce34a254e5bd24c46a38ab6aaff57c38682490f3e888fe383b2fe2); /* line */ 
            coverage_0xf7de2292(0x4dea0b8fa30aff9dd761d16a5d329378b3c84d32bba9cd4c532da6747aa8a002); /* statement */ 
Require.that(
                outputMarketId == owedMarketId,
                FILE,
                "outputMarket mismatch",
                outputMarketId
            );
coverage_0xf7de2292(0x2b5849c18b31fd825696fd0c16a3fd0db7c81a50f0e913ed2705207d50a26fa1); /* line */ 
            coverage_0xf7de2292(0xf266bf589d24bb40fa9f9cc5ca48c80c8e0cb436bedcbf39d4cb4c26ea2bbd65); /* statement */ 
Require.that(
                !newInputPar.isNegative(),
                FILE,
                "Collateral cannot be overused",
                newInputPar.value
            );
coverage_0xf7de2292(0x6ce56cf8909c0f51f8fdb47042a929e7e5f55072ed6514031038fc100d10fbc3); /* line */ 
            coverage_0xf7de2292(0x1d92a5d10ea246d42e48f5e6e146d13ff9a90ee80d108f5ff5a728229bfb2adc); /* assertPre */ 
coverage_0xf7de2292(0x3679e8aab4d2c50dd53d0b27f4fd7539cc3a79cfae7385e7abfb3c9a8dcf21f1); /* statement */ 
assert(oldInputPar.isPositive());coverage_0xf7de2292(0xf0a3d3c13f3fd206cf1cfe49505326b285329fc8abcba9de10143851cca20d5b); /* assertPost */ 

coverage_0xf7de2292(0xda5abf5aaeff7cb100c6ba79ccdb1e2f1df39fadd113374153b5ecfe9aa16ba4); /* line */ 
            coverage_0xf7de2292(0xbb3f9797180b4b94dd8bba727316c2f1108127b079c6be33c0e5212f6563ade0); /* statement */ 
Require.that(
                maxOutputWei.isNegative(),
                FILE,
                "Borrows must be negative",
                outputMarketId,
                maxOutputWei.value
            );
coverage_0xf7de2292(0xe2fe11c115b27d11f1f079368eb274e9667659ab9ed8f56452fe5818c9871d5b); /* line */ 
            coverage_0xf7de2292(0xf1b094249e485f4acf8d1c33c7dcd467305046ad29fadf453019edf554a540b1); /* statement */ 
output = heldWeiToOwedWei(
                inputWei,
                inputMarketId,
                outputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
coverage_0xf7de2292(0x9f0a234537097162745b66925ebb7ed52b523794266be923903ed00a1466a538); /* line */ 
            coverage_0xf7de2292(0x1d6aa26cfce363d89d6d00da6775664919544c8a727b4c00b739c250579808dd); /* statement */ 
if (output.value == maxOutputWei.value) {coverage_0xf7de2292(0xb3bc980e433b248d526a94d7c7335cf9856c79ef4dcecd46dae72455f44ecdd9); /* branch */ 

coverage_0xf7de2292(0xcba9904f3a104193dd36d6d4dfdd5c7216def7e8626f8ed136ba47dde377fd36); /* line */ 
                coverage_0xf7de2292(0x1547d0536b588d9fdaedd84b08516d500db561bd5825066c06a3a5aaaf969826); /* statement */ 
setExpiry(makerAccount, owedMarketId, 0);
            }else { coverage_0xf7de2292(0xd79e612e8d283580b8f5a5658558dbbf7152db78cecd6bfd88d4d66a7c78a055); /* branch */ 
}
        }

coverage_0xf7de2292(0xf7cb8f23e1efef452d5ca67f8396e3d0ba8ebb7d95e143bcad48b45732924ee3); /* line */ 
        coverage_0xf7de2292(0x494b298a2a367bf2607aeb4dbb50f67608840a71a61d92c627f0041e0a20940c); /* statement */ 
Require.that(
            output.value <= maxOutputWei.value,
            FILE,
            "outputMarket too small",
            output.value,
            maxOutputWei.value
        );
coverage_0xf7de2292(0xf58ca90274374098ae1d3c77beaaccdb162503970bf34a84d6afde30f4dd4308); /* line */ 
        coverage_0xf7de2292(0xf5b5111ac5e5cef0cf2b90d1ea3e267936dcdf51680443120aab80f83e486816); /* assertPre */ 
coverage_0xf7de2292(0xac44fd5cd9475a86dbc71b1d678849c79d4a5b00c64e1aad6fd5ea61758d6921); /* statement */ 
assert(output.sign != maxOutputWei.sign);coverage_0xf7de2292(0xdcfc37fe21909e4a172a9fbb505da3402fe196daedc2b7b01890ef3a080a0704); /* assertPost */ 


coverage_0xf7de2292(0xb5a4fca1a7f77947d16acd0116289c47b460e81c0746351293850dd404752a32); /* line */ 
        coverage_0xf7de2292(0xbe6a78718a4dac4401b6665855babb11ff788b4397ca5958a3974002e6b6ec4d); /* statement */ 
return output;
    }

    function setExpiry(
        Account.Info memory account,
        uint256 marketId,
        uint32 time
    )
        private
    {coverage_0xf7de2292(0x77cc8000f466ea10877714b993198bf3b25c5e90cd7795b06fe2ddc383fad603); /* function */ 

coverage_0xf7de2292(0x361ac023037c765c98584235e695c4875ea9fe833ec9ddef0118b6d392b66ca2); /* line */ 
        coverage_0xf7de2292(0x5da43041fc9cf1595c0fdf77b8f65c61db9096d18e16d7f585f8fa6514ca8c21); /* statement */ 
g_expiries[account.owner][account.number][marketId] = time;

coverage_0xf7de2292(0x89ab3a9992138c1944371adf8b879c3f3573c61956d2c7fa13f11c066a289901); /* line */ 
        coverage_0xf7de2292(0x03482f0e1cac33ce3aa7ce4e2c3b518790503fffe2348cd492dd124867a47881); /* statement */ 
emit ExpirySet(
            account.owner,
            account.number,
            marketId,
            time
        );
    }

    function heldWeiToOwedWei(
        Types.Wei memory heldWei,
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
    )
        private
        view
        returns (Types.AssetAmount memory)
    {coverage_0xf7de2292(0xc67da27677b48c84834024a83c30e12dfe726a2646e405a1d98403dcbdb3cf2e); /* function */ 

coverage_0xf7de2292(0x775e4e08aa35829ec6e9da46b5952fe8b531333ac270018998e50af92723af24); /* line */ 
        coverage_0xf7de2292(0x04e5ce21f1e1280b230ec38821873a288a6db47a8cf207f174859bb13ab3c680); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            expiry
        );

coverage_0xf7de2292(0x1addbc8706f0942df7c7d721ed74a1aa6cd83f5c53b457800c29ca649043f9bb); /* line */ 
        coverage_0xf7de2292(0xd2c0c3282360341354361c753e8ce12e63a1698f2aeed899074938e05408d7bd); /* statement */ 
uint256 owedAmount = Math.getPartialRoundUp(
            heldWei.value,
            heldPrice.value,
            owedPrice.value
        );

coverage_0xf7de2292(0xf557ae2afcf8e7326f27ea472f657e683b6daec7702519c1537c4b60a21e6dd5); /* line */ 
        coverage_0xf7de2292(0xfce090c641b99e9975054c52f4dd0ed235eaac93536497c8c997b116f4aadc4d); /* statement */ 
return Types.AssetAmount({
            sign: true,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: owedAmount
        });
    }

    function owedWeiToHeldWei(
        Types.Wei memory owedWei,
        uint256 heldMarketId,
        uint256 owedMarketId,
        uint32 expiry
    )
        private
        view
        returns (Types.AssetAmount memory)
    {coverage_0xf7de2292(0x93af3a0b967aae5447f43a509077d46a876af79bea3e086af28e4186d74b2764); /* function */ 

coverage_0xf7de2292(0x88191c7d0b2b461f5b73d01459d438d695f8d1b12ed6cea155a5c399ce6a62c0); /* line */ 
        coverage_0xf7de2292(0xc67a3243580bc73dfdbab4d231c6e8a7ab8924b65c96416b8e3a0353cde7466b); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            expiry
        );

coverage_0xf7de2292(0xab488567b8d79146875f8135d1897d86b844a4550fd5a6f94df2623513875d63); /* line */ 
        coverage_0xf7de2292(0xa02d2d096739a6e048cc41e896c37d59459d0a729dc3f9ff4addb52a4c4b3787); /* statement */ 
uint256 heldAmount = Math.getPartial(
            owedWei.value,
            owedPrice.value,
            heldPrice.value
        );

coverage_0xf7de2292(0x36ffb0b5aefb13704e7ad13fee19fb3200c2cc661d8621749b2ba6972726854b); /* line */ 
        coverage_0xf7de2292(0x1c026d23d6c8a88b99cb17615e40bd150b6c363e77e6b1793502c5ca98d7a2f6); /* statement */ 
return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: heldAmount
        });
    }

    function parseCallArgs(
        bytes memory data
    )
        private
        pure
        returns (
            uint256,
            uint32
        )
    {coverage_0xf7de2292(0x874c0ae43d061f6798b9bf17b1bb300cd133e2b047185e97fc6712e083a33a86); /* function */ 

coverage_0xf7de2292(0x71261d8f77ef23ec2bf7bd0167f7b203d03e5741705780e3ed84202c06e4712e); /* line */ 
        coverage_0xf7de2292(0x6e187ab2cacfcf0d36fd7e869e5b66b4818fcf786ae364d6f1543e4208d960c8); /* statement */ 
Require.that(
            data.length == 64,
            FILE,
            "Call data invalid length",
            data.length
        );

coverage_0xf7de2292(0xefb82592a8cfe91d4f78bacf85f67ff429802a7d6cb442bdad390dcc4ecc9fdb); /* line */ 
        coverage_0xf7de2292(0xf39164b7943464e63b566dc9c828910991211ac4d5205affcb75e9f0489d7bfc); /* statement */ 
uint256 marketId;
coverage_0xf7de2292(0xf35eb84d12f2a34d4facddcfd4b9b33ce18be97ba2fe200c0cf3ac88fe393f6e); /* line */ 
        coverage_0xf7de2292(0xb58281832d4f4d7009c30510a3c76be646dc029af4dceea70e73ecb1a1543ea0); /* statement */ 
uint256 rawExpiry;

        /* solium-disable-next-line security/no-inline-assembly */
coverage_0xf7de2292(0x4217a12b73c648dd9231607ad6eeeba36cbaac7e6c7c194270aaef9ed83f0795); /* line */ 
        assembly {
            marketId := mload(add(data, 32))
            rawExpiry := mload(add(data, 64))
        }

coverage_0xf7de2292(0x2b510ddf739f7c0d4d25574f3da24e2408857d97381ed36ce23446d47ccc748e); /* line */ 
        coverage_0xf7de2292(0xa82ca57bd3c826bd0875330a88423eb5d79a635241b3c75d4d223d9b133cab9f); /* statement */ 
return (
            marketId,
            Math.to32(rawExpiry)
        );
    }

    function parseTradeArgs(
        bytes memory data
    )
        private
        pure
        returns (
            uint256,
            uint32
        )
    {coverage_0xf7de2292(0x28edf1a7d3644f3f03691ca2ffda0f564a0d906e352dc36b71216d6a4594d185); /* function */ 

coverage_0xf7de2292(0xf2b3c13fcb410bdd5a01deee72143228c759e8d34aefaf63ea5afa68dd75ba09); /* line */ 
        coverage_0xf7de2292(0x0f2b66c0feba34920d988ba6e0111e3328e0cb07780ca6178b02da1aadff93e4); /* statement */ 
Require.that(
            data.length == 64,
            FILE,
            "Trade data invalid length",
            data.length
        );

coverage_0xf7de2292(0xadd21820b05b60a29de584c488d2240abba6a8dcf79ace58bfbf659abe3c6859); /* line */ 
        coverage_0xf7de2292(0x394ebba0eb4b590f4ab268907039a178b9d07a0ec4907c1ca26611cd4f4d1785); /* statement */ 
uint256 owedMarketId;
coverage_0xf7de2292(0x9b48a118bc3be10db4e8bcbdb1ffd69674fb9d23b4a84c409459d7362c44c6a1); /* line */ 
        coverage_0xf7de2292(0x4bfdbe024d1dce833e993746ae99d5afc8546dbc7c92ef4ac5b85c0ce778a5ab); /* statement */ 
uint256 rawExpiry;

        /* solium-disable-next-line security/no-inline-assembly */
coverage_0xf7de2292(0x7bb3a83a28d14a90bf9410c046a278e9a2a07619a3d5cd26d098002823ee9177); /* line */ 
        assembly {
            owedMarketId := mload(add(data, 32))
            rawExpiry := mload(add(data, 64))
        }

coverage_0xf7de2292(0x360abafbf676cb1f5216ed37460e7235c3087071d18cde0e83b12976e3a666e4); /* line */ 
        coverage_0xf7de2292(0x0c12086e63455a930443f852523440394e7494203afa240424f1faaedcf01089); /* statement */ 
return (
            owedMarketId,
            Math.to32(rawExpiry)
        );
    }
}
