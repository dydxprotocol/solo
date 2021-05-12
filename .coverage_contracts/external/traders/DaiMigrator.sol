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
import { IAutoTrader } from "../../protocol/interfaces/IAutoTrader.sol";
import { Account } from "../../protocol/lib/Account.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";


/**
 * @title DaiMigrator
 * @author dYdX
 *
 * Allows for moving SAI positions to DAI positions.
 */
contract DaiMigrator is
    Ownable,
    IAutoTrader
{
function coverage_0x64cf7360(bytes32 c__0x64cf7360) public pure {}

    using Types for Types.Wei;
    using Types for Types.Par;

    // ============ Constants ============

    bytes32 constant FILE = "DaiMigrator";

    uint256 constant SAI_MARKET = 1;

    uint256 constant DAI_MARKET = 3;

    // ============ Events ============

    event LogMigratorAdded(
        address migrator
    );

    event LogMigratorRemoved(
        address migrator
    );

    // ============ Storage ============

    // the addresses that are able to migrate positions
    mapping (address => bool) public g_migrators;

    // ============ Constructor ============

    constructor (
        address[] memory migrators
    )
        public
    {coverage_0x64cf7360(0x02e9ff46f660b0f9080b3d0274407b3f6591931baae0fc8196040ecebf63c849); /* function */ 

coverage_0x64cf7360(0x0d6bca2c0f74f4f00cc2b89bd8da47a0cced53a9456492a40beade958b0c904a); /* line */ 
        coverage_0x64cf7360(0x2c7ca44fc8c3aa29d38e6cda51fbb574f84e59b8fd9ceee315dbe9097314be79); /* statement */ 
for (uint256 i = 0; i < migrators.length; i++) {
coverage_0x64cf7360(0x4ca04e2e2ebd22c7879feb53cc55f86112e2213e553e755f8818b1cf39f126ff); /* line */ 
            coverage_0x64cf7360(0x9363e345c8038f8635894c75439d3dfbe7ee26d06270e3b4b379f018ece4b8b9); /* statement */ 
g_migrators[migrators[i]] = true;
        }
    }

    // ============ Admin Functions ============

    function addMigrator(
        address migrator
    )
        external
        onlyOwner
    {coverage_0x64cf7360(0xdf9ff229c39d953728438d115e0bf9f01adf106d9eb78edf50baca98d90fc3bb); /* function */ 

coverage_0x64cf7360(0x6ffe091759eac0f20014ce860584ced2cabf29a65eea20505e55d175f3157bb4); /* line */ 
        coverage_0x64cf7360(0xc82eb97ca173981c3b0439bf367a10aa30937678cea244faf16a4aa477e16294); /* statement */ 
emit LogMigratorAdded(migrator);
coverage_0x64cf7360(0x846cf7233bfffe30564e2662e3cc85e2056bae57368452bdf9ca6e217e25bc56); /* line */ 
        coverage_0x64cf7360(0x79c60bb5f7595760643509afb8e671f17a92416c06945f8abfaf05014e3c96fe); /* statement */ 
g_migrators[migrator] = true;
    }

    function removeMigrator(
        address migrator
    )
        external
        onlyOwner
    {coverage_0x64cf7360(0x84951078c9676049e1d3473af8a827a46f481a417beed6110c8f6bdff09893c5); /* function */ 

coverage_0x64cf7360(0x55c96cf81898f18c274db899aacb8c1ca4272465771d3b32fc5016a97fafb30e); /* line */ 
        coverage_0x64cf7360(0x45a62221bd98e6b2e251a3af1fbf8ed7a9f8fa8052ef26c5f38da06125a22a52); /* statement */ 
emit LogMigratorRemoved(migrator);
coverage_0x64cf7360(0xcbfd73977624296de4b717ed760b005b273b542530d94f433ad16b6cf31eb712); /* line */ 
        coverage_0x64cf7360(0xb529adb2646fd956533f10c26535ef1d503ae118f80e6e7a7c3de400a19dbfa9); /* statement */ 
g_migrators[migrator] = false;
    }

    // ============ Only-Solo Functions ============

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory /* makerAccount */,
        Account.Info memory takerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory /* data */
    )
        public
        /* view */
        returns (Types.AssetAmount memory)
    {coverage_0x64cf7360(0xe114dd6fb05631129ce8a8c355191937c6fafffdae14a21fc2d2b05ac60e8e7c); /* function */ 

coverage_0x64cf7360(0xa5ab30f691288e71b4714891af9ffe07cfb62e3e73c756e94485665a433ffaec); /* line */ 
        coverage_0x64cf7360(0x8b5c03029dca91facdd37ac6ef2816522cda03c2fb7529217fa61182e42ecad9); /* statement */ 
Require.that(
            g_migrators[takerAccount.owner],
            FILE,
            "Migrator not approved",
            takerAccount.owner
        );

coverage_0x64cf7360(0x25bdba5378ce349de80d6208d22c53da88eaa3022ee7ac67c2bd0ec4e6fc5f8a); /* line */ 
        coverage_0x64cf7360(0x0ad6a4df0258e4e683e38073f66e9a874c9c57bfe445648be6fbe3e45ee2c796); /* statement */ 
Require.that(
            inputMarketId == SAI_MARKET && outputMarketId == DAI_MARKET,
            FILE,
            "Invalid markets"
        );

        // require that SAI amount is getting smaller (closer to zero)
coverage_0x64cf7360(0xebcc186a35e02d3388d9016d0cee2e06f2df24c2788465312db6b739d2846b59); /* line */ 
        coverage_0x64cf7360(0x489f610e30758ba92208d630d8ccdc3302137d0014aeae70ffb1d4a4ff664907); /* statement */ 
if (oldInputPar.isPositive()) {coverage_0x64cf7360(0xdd4f99fe48414988eaa0501487dfa3eea86722fa6018ff82ac8062eda3c04045); /* branch */ 

coverage_0x64cf7360(0x3579b74b4cef764846a702e3f37c6a71fd8ba54f78be194f5b97c61f72cfa232); /* line */ 
            coverage_0x64cf7360(0xe273ad8380b53acd9e125a5f3faf41d8d12c47b343cb2d585b87d155fb971dc1); /* statement */ 
Require.that(
                inputWei.isNegative(),
                FILE,
                "inputWei must be negative"
            );
coverage_0x64cf7360(0x9ce417b3e656f50f4237bad14ba256d42d739491e0bf575e9ee7200fd26ec189); /* line */ 
            coverage_0x64cf7360(0xec6aff832fb778bc92991c565b685e8560548b018be5792ca099eb9f84794c29); /* statement */ 
Require.that(
                !newInputPar.isNegative(),
                FILE,
                "newInputPar cannot be negative"
            );
        } else {coverage_0x64cf7360(0x8145fce6591c1266b310a8a240ec9234491e6a0b0ab794086a95ee9265078c1e); /* statement */ 
coverage_0x64cf7360(0xefb86d7ba6212b9d6199a78477e7b9cd3a591469e4eb0f51d64ddb906fa84daf); /* branch */ 
if (oldInputPar.isNegative()) {coverage_0x64cf7360(0x131d285cf63b5acafbb7f755a89ee749b62f98f82e79060a6fcf099d3393c006); /* branch */ 

coverage_0x64cf7360(0x03af5cbcbdbede255ebd223956dd967a4e4a1633546e96ceae77d2ed2c1877bc); /* line */ 
            coverage_0x64cf7360(0xc5ff77434391195c2563287d6ed7b03163993ad3bbd56c505015ee7c32650b83); /* statement */ 
Require.that(
                inputWei.isPositive(),
                FILE,
                "inputWei must be positive"
            );
coverage_0x64cf7360(0x784515620ea6aaae57675a2ebc905451ace125f001f0e534581d776eca7baca7); /* line */ 
            coverage_0x64cf7360(0xcd456d777e3c6a7c2d7a251881d346c261dc6e941b521d18209c41f8449a60f9); /* statement */ 
Require.that(
                !newInputPar.isPositive(),
                FILE,
                "newInputPar cannot be positive"
            );
        } else {coverage_0x64cf7360(0x44f1803b25323e60788f2d84a0689d101644df53f0d8dbed1cd1c1dca2e66294); /* branch */ 

coverage_0x64cf7360(0xc85c4a06c2ab44c1874764584ad4be918c9d3d3e52963df45e6528e51fcbd074); /* line */ 
            coverage_0x64cf7360(0x097117eabfbb1bbc62fe7765b776e6336e5ac3582b34d53a26548cb8c8453ec2); /* statement */ 
Require.that(
                inputWei.isZero() && newInputPar.isZero(),
                FILE,
                "inputWei must be zero"
            );
        }}

        /* return the exact opposite amount of SAI in DAI */
coverage_0x64cf7360(0x782aeaed75c2a6b9cddf2a46d53cf4aaac5eb95acb12302938c9270636014e4f); /* line */ 
        coverage_0x64cf7360(0xea715acbc343bfcc695d8583f59e3d63181cddee59d1d63926bce0e1d3e13e9d); /* statement */ 
return Types.AssetAmount ({
            sign: !inputWei.sign,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: inputWei.value
        });
    }
}
