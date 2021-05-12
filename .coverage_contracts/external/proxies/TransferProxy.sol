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

import {ReentrancyGuard} from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import {SoloMargin} from "../../protocol/SoloMargin.sol";
import {Account} from "../../protocol/lib/Account.sol";
import {Actions} from "../../protocol/lib/Actions.sol";
import {Types} from "../../protocol/lib/Types.sol";
import {Require} from "../../protocol/lib/Require.sol";
import {OnlySolo} from "../helpers/OnlySolo.sol";


/**
 * @title PayableProxyForSoloMargin
 * @author dYdX
 *
 * Contract for wrapping/unwrapping ETH before/after interacting with Solo
 */
contract TransferProxy is
OnlySolo,
ReentrancyGuard
{
function coverage_0x6401a430(bytes32 c__0x6401a430) public pure {}

    // ============ Constants ============

    bytes32 constant FILE = "TransferProxy";

    // ============ Constructor ============

    constructor (
        address soloMargin
    )
    public
    OnlySolo(soloMargin)
    {coverage_0x6401a430(0xc83eed0ff91610e720521c8d8ebf4fc787f26149b2c498b9defd5280291d8540); /* function */ 
}

    // ============ Public Functions ============

    function transfer(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address token,
        uint amount
    )
    public
    nonReentrant
    {coverage_0x6401a430(0x44aa481e9bbe5b92e39e1a8671c35d41b1de9782b54476d118ddd258d2e86020); /* function */ 

coverage_0x6401a430(0x7deea2f18f5819f80f5bf7e2a90783412df38e70c97846207c556c26ef457933); /* line */ 
        coverage_0x6401a430(0xd53bd36e08a2c014b7d1781c2fb5039c9f4d63ee75a04795dab10dc289cf8e8c); /* statement */ 
uint[] memory markets = new uint[](1);
coverage_0x6401a430(0x8721019e68827f569d7d73c1e01d6254e8f9539ed4eecbef55fd3c4af34d7fbe); /* line */ 
        coverage_0x6401a430(0xff6169c8ab155b12fa093f890205ba48c043802e514ff5ac36fbaab9c3ec401e); /* statement */ 
markets[0] = SOLO_MARGIN.getMarketIdByTokenAddress(token);

coverage_0x6401a430(0xd174bf66f9923ba2769d6543d1cc164bedef53cebdfc19e960f451f30dcd4a1c); /* line */ 
        coverage_0x6401a430(0xb303e8095f4d912bddcacb1ab5f1f2a73152cb7fcc12467f289970336dce6099); /* statement */ 
uint[] memory amounts = new uint[](1);
coverage_0x6401a430(0xbb403b9e80b32de0ccb89ac63023a309b814de27670347547215a828ae46389f); /* line */ 
        coverage_0x6401a430(0xbcd785a04f8dfd257f10cc267ae385febf2b5333d9382ba1fa28612a5e36a46c); /* statement */ 
amounts[0] = amount;

coverage_0x6401a430(0xc0d4f2bed148e73a27ddeec94f10920f009b3cc8ee977f17d63db02a5d2ce06c); /* line */ 
        coverage_0x6401a430(0xd01f799bbd5cbc25b3e6c329300757885051a80712f12faea8b0fe76ec701249); /* statement */ 
_transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function transferMultiple(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        address[] calldata tokens,
        uint[] calldata amounts
    )
    external
    nonReentrant
    {coverage_0x6401a430(0xb2b805449726f913b192a7b37525751b30d1841c7c1e3f2f907985cf7adaaa55); /* function */ 

coverage_0x6401a430(0x70e254f0d19ecc110031d16af72f470fb800180f19c7c8dbf2cb645ef5d0de58); /* line */ 
        coverage_0x6401a430(0x51eefd41eb86f3dd456004d8f731b9a253ee86345c4beddc0dd353e1bfc70b0f); /* statement */ 
SoloMargin soloMargin = SOLO_MARGIN;
coverage_0x6401a430(0x73ee3a8a7ca03980ef721ea788fc1b6cab3017c52309dba820614d9f13aae025); /* line */ 
        coverage_0x6401a430(0x042903f9863f484640b4902e7ee5a96389ac912652d72198c87e152f44c9529f); /* statement */ 
uint[] memory markets = new uint[](tokens.length);
coverage_0x6401a430(0xba9f6a8a84a92375b4f85ae02a5bb44ed08dd84a982b759686c7b753d2801083); /* line */ 
        coverage_0x6401a430(0x5755314c942ccbcf7ce913f50f70a2c74695c498e33728039235a7b451bb9d0b); /* statement */ 
for (uint i = 0; i < markets.length; i++) {
coverage_0x6401a430(0x538e9c4d212c1f5088169ec4e79f60f7b2d34e7122aa23c5f266db4822ee0c99); /* line */ 
            coverage_0x6401a430(0x10680086906e12b869a3d2a2910cbcd8ca3f43568c7af52108f9ff7a874a2031); /* statement */ 
markets[i] = soloMargin.getMarketIdByTokenAddress(tokens[i]);
        }

coverage_0x6401a430(0x986100e330d86fa51059321082f54d35f70f7c3e59db9511cd12e706ebd037a8); /* line */ 
        coverage_0x6401a430(0xe2bbca7dcb1b9fa06b710f7fc331bae03c041b0d76a197dad5cf7668aeccdfee); /* statement */ 
_transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function transferMultipleWithMarkets(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        uint[] calldata markets,
        uint[] calldata amounts
    )
    external
    nonReentrant
    {coverage_0x6401a430(0xa3b16213cf7f8b0fac50584ef3d431612b7ae3e0005f52156bac0814257ce29f); /* function */ 

coverage_0x6401a430(0x7fb4008bb2580c5acc070286ecf80874704099da02ab8d7b6d80dfbdac9cf972); /* line */ 
        coverage_0x6401a430(0xecc1fb8b3a0ffc4ee36860df2350547fe151acdf59ed0ea2a929206d38c248c5); /* statement */ 
_transferMultiple(
            fromAccountIndex,
            to,
            toAccountIndex,
            markets,
            amounts
        );
    }

    function _transferMultiple(
        uint fromAccountIndex,
        address to,
        uint toAccountIndex,
        uint[] memory markets,
        uint[] memory amounts
    )
    internal
    {coverage_0x6401a430(0xac3805594353b9496751073c65b904c5e74b130b694d265b3875faed01bd991b); /* function */ 

coverage_0x6401a430(0x8d947c6288e3f61c27dac53da1e2743efb5a2d7f800c4844b7ed3a25d2908501); /* line */ 
        coverage_0x6401a430(0xac7784d68b91c84299dc018656b63b132b3d5e88ba2f3f4916de0aa168876e4b); /* assertPre */ 
coverage_0x6401a430(0xcf99c81c1208a054102179c384f5ce17f807fd85c30a779ed8b5273e6e7912b5); /* statement */ 
require(
            markets.length == amounts.length,
            "TransferProxy::_transferMultiple: INVALID_PARAMS_LENGTH"
        );coverage_0x6401a430(0x37701bfdfbde2a0b1ff35b2e8d168750d0f33af6e8db6719a3bde4909154a273); /* assertPost */ 


coverage_0x6401a430(0x16e18a266c9aee768e0d13fde5dbe1a234adf3003eb9aba6d84fdb832b68adb1); /* line */ 
        coverage_0x6401a430(0x72e5a95943890b4a5c6d74839ceeb20808493f32efc62f6ec87497d76f1e5c8c); /* statement */ 
Account.Info[] memory accounts = new Account.Info[](2);
coverage_0x6401a430(0xd12c8c3ecbcfc32afaae1e84c1d26acfc7160c9ec9eacefd8a7389b2c4cb8cfc); /* line */ 
        coverage_0x6401a430(0x0ec0bb2f14e23825a9bc9cbe1013f9bd1f1f8bd0192132f8fecd3230dc6d2bd3); /* statement */ 
accounts[0] = Account.Info(msg.sender, fromAccountIndex);
coverage_0x6401a430(0x7f954389ce811b386c167ededff4490ae31c38c91a51bc31896a30f78315b612); /* line */ 
        coverage_0x6401a430(0x378373d19fffff3270fe9f9edb3faa724ae1c86a8c093f3f63a7b89ab3b810da); /* statement */ 
accounts[1] = Account.Info(to, toAccountIndex);

coverage_0x6401a430(0x21af3b8759d4cddc8a839cb98cd05a216fef33c9ce2fdeecfca00d9889a7fcf9); /* line */ 
        coverage_0x6401a430(0xc5d3748eb6d73a784e54c813ed7f2d71f5d76a23604e384035aa397720168c47); /* statement */ 
Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](markets.length);
coverage_0x6401a430(0x9612e6b38e420e8fb6bf162a787084a622d1b6da2602d6f99de92924d303baa6); /* line */ 
        coverage_0x6401a430(0x2bd3954aeb690f15929ec0c0b544a01736bac27b9915337ea8707e24fe152c82); /* statement */ 
for (uint i = 0; i < markets.length; i++) {
coverage_0x6401a430(0x64e303ee6112bce3f2d262182ee71402f80ec7b9ccd0ab6a4218d6ef9a6dc8c7); /* line */ 
            coverage_0x6401a430(0xe36d9e404c9f7a253824c4a22b05145acecbf20ba7caf2e11257042cd0e76a70); /* statement */ 
Types.AssetAmount memory assetAmount;
coverage_0x6401a430(0xc5e1dd7c95c3e2e757efc4494e82684b507eb307d228fa9a41fe087810c04622); /* line */ 
            coverage_0x6401a430(0xa258aa07baa0b3006c8e4996b55633cf58d69fcaf6b54563344a8c549147ee94); /* statement */ 
if (amounts[i] == uint(- 1)) {coverage_0x6401a430(0x2f7124fde4e2e6cd8176fcdf27e76d0ff4cf03d523b327160b1dfd927b525824); /* branch */ 

coverage_0x6401a430(0x1da8b0e973f19ce787de4c26847c56fcf053255271037e5fe24b92fcfaafe3da); /* line */ 
                coverage_0x6401a430(0x1e6a9d5c989f13c11889b9b305059d2f8f0ac4d7f4b4f232e1c40939d97ee889); /* statement */ 
assetAmount = Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0);
            } else {coverage_0x6401a430(0xd96049770127f5d52141160e59e085e90d78b49c2b38eb4878226ba85e220f74); /* branch */ 

coverage_0x6401a430(0x74070d7d35aa517bdaf57c68a62a247bacfbffede965f28f4899827f30e44072); /* line */ 
                coverage_0x6401a430(0xab112c6cee8cbb5ea51c57c1e9e8f28e9c134a9d792d5d443121a7817298370d); /* statement */ 
assetAmount = Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amounts[i]);
            }

coverage_0x6401a430(0xd501d014726f5af01c4eefd03c24c8bb05abaefa165715be80f29b944dd17725); /* line */ 
            coverage_0x6401a430(0x9c858f7a9ff2994f297db9334bd15188e49fe7b165bae770beb59d9a8d3305e5); /* statement */ 
actions[i] = Actions.ActionArgs({
            actionType : Actions.ActionType.Transfer,
            accountId : 0,
            amount : assetAmount,
            primaryMarketId : markets[i],
            secondaryMarketId : uint(- 1),
            otherAddress : address(0),
            otherAccountId : 1,
            data : bytes("")
            });
        }

coverage_0x6401a430(0xf0c3ac8527467bbcb8ede7998541fd92c1ff0352388062322a68ccdf85957541); /* line */ 
        coverage_0x6401a430(0x7303ba56517f4d058dfdc328d9c89d5b3edbc9560df11d800b67bab31485eac7); /* statement */ 
SOLO_MARGIN.operate(accounts, actions);
    }
}
