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

import { DelayedMultiSig } from "./DelayedMultiSig.sol";


/**
 * @title PartiallyDelayedMultiSig
 * @author dYdX
 *
 * Multi-Signature Wallet with delay in execution except for some function selectors.
 */
contract PartiallyDelayedMultiSig is
    DelayedMultiSig
{
function coverage_0x4fa1ff45(bytes32 c__0x4fa1ff45) public pure {}

    // ============ Events ============

    event SelectorSet(address destination, bytes4 selector, bool approved);

    // ============ Constants ============

    bytes4 constant internal BYTES_ZERO = bytes4(0x0);

    // ============ Storage ============

    // destination => function selector => can bypass timelock
    mapping (address => mapping (bytes4 => bool)) public instantData;

    // ============ Modifiers ============

    // Overrides old modifier that requires a timelock for every transaction
    modifier pastTimeLock(
        uint256 transactionId
    ) {coverage_0x4fa1ff45(0xd2a015a95012b38c33ce3f2107f1a6516c72b50eff84d440af0797c40fbdb4e3); /* function */ 

        // if the function selector is not exempt from timelock, then require timelock
coverage_0x4fa1ff45(0x284a4aac15e3c4fd31d841ff827e4c46e6188b2586fd011731cb48259c9d9d95); /* line */ 
        coverage_0x4fa1ff45(0x6fee44c6d26837a65bff13cdc2fd695ed3b42a0b024c3063b145ad2c459adb14); /* assertPre */ 
coverage_0x4fa1ff45(0xb1726f5bb205aaa9f50bb6bc70685b6481ddd95d9b6930be9749e68cba52bc9d); /* statement */ 
require(
            block.timestamp >= confirmationTimes[transactionId] + secondsTimeLocked
            || txCanBeExecutedInstantly(transactionId),
            "TIME_LOCK_INCOMPLETE"
        );coverage_0x4fa1ff45(0xd21618dabd2a34f2e330f2b242bd81fb3ce2c13159384cae29b27353f003c2ba); /* assertPost */ 

coverage_0x4fa1ff45(0xad0204cf2a5e60a1d475bc247b444598eeac38681fdb54a3fa2897b1f1f44a41); /* line */ 
        _;
    }

    // ============ Constructor ============

    /**
     * Contract constructor sets initial owners, required number of confirmations, and time lock.
     *
     * @param  _owners               List of initial owners.
     * @param  _required             Number of required confirmations.
     * @param  _secondsTimeLocked    Duration needed after a transaction is confirmed and before it
     *                               becomes executable, in seconds.
     * @param  _noDelayDestinations  List of destinations that correspond with the selectors.
     *                               Zero address allows the function selector to be used with any
     *                               address.
     * @param  _noDelaySelectors     All function selectors that do not require a delay to execute.
     *                               Fallback function is 0x00000000.
     */
    constructor (
        address[] memory _owners,
        uint256 _required,
        uint32 _secondsTimeLocked,
        address[] memory _noDelayDestinations,
        bytes4[] memory _noDelaySelectors
    )
        public
        DelayedMultiSig(_owners, _required, _secondsTimeLocked)
    {coverage_0x4fa1ff45(0x3b8eca8943724e055764a706bddd37ce89a402addf515e2dcee9a1a82dfce524); /* function */ 

coverage_0x4fa1ff45(0xd4add8ec2f66baff679a6047c1ec696fa9924b0b1d055907272c20a929e666e8); /* line */ 
        coverage_0x4fa1ff45(0x4e0922ae8e44d134fd15e77b2a0e8d86cb447ca2c8fa71e4e409d519609af15b); /* assertPre */ 
coverage_0x4fa1ff45(0x976a2354cc6ddf945d8653ba76f1e3cd3830d07fd34c172373c8969c5ea32f9d); /* statement */ 
require(
            _noDelayDestinations.length == _noDelaySelectors.length,
            "ADDRESS_AND_SELECTOR_MISMATCH"
        );coverage_0x4fa1ff45(0xf5a7d1d1b1d52fe4f1dff78452fa6e24350d1f3be60534d6aba0f083fa5a2c30); /* assertPost */ 


coverage_0x4fa1ff45(0x0c73f96352fdda1c5716354bcbdd2f14e5ce8323f5ac00a6273a0af892ce8b05); /* line */ 
        coverage_0x4fa1ff45(0xfb907dc93eb09e6131fd37c95bbe2d72aaa2ec221ca0b42563d95b810088d55f); /* statement */ 
for (uint256 i = 0; i < _noDelaySelectors.length; i++) {
coverage_0x4fa1ff45(0x16456f36703ccdac8c6600fd4caf4bcbfb4de2538f735cc7a511d058c3eb3830); /* line */ 
            coverage_0x4fa1ff45(0x7b2eeabd0b2a9d620a2a91a368603805c6797645fd2547d39826d3286892c9e7); /* statement */ 
address destination = _noDelayDestinations[i];
coverage_0x4fa1ff45(0x4fe807de49d59e68f91b5f156ca1a533b9eac42084da4c077d3c138e113f025a); /* line */ 
            coverage_0x4fa1ff45(0xca4269c8bf22403a0f60a2659c1b422c888bd0f18cd3e9049147106ff4a1a19f); /* statement */ 
bytes4 selector = _noDelaySelectors[i];
coverage_0x4fa1ff45(0x9f3a0d5cb7b49cfe99cd1603f5be61569e4c1c02dbb473feac0f934b5ff4b2a8); /* line */ 
            coverage_0x4fa1ff45(0x2d4a3003bde9dcca89154aa8c9dbfb907759c23e1f2d948baa7c6ae73e8c6395); /* statement */ 
instantData[destination][selector] = true;
coverage_0x4fa1ff45(0x0e0d5c27b882b31ba3bd3fd9bfeabc6b99f1aa82b7c08a3381f7bf34594ac0ae); /* line */ 
            coverage_0x4fa1ff45(0xce80a4ecb933f8c1d1900a2cbfb5cdc53201f20352abc59d1039d4641ab10f25); /* statement */ 
emit SelectorSet(destination, selector, true);
        }
    }

    // ============ Wallet-Only Functions ============

    /**
     * Adds or removes functions that can be executed instantly. Transaction must be sent by wallet.
     *
     * @param  destination  Destination address of function. Zero address allows the function to be
     *                      sent to any address.
     * @param  selector     4-byte selector of the function. Fallback function is 0x00000000.
     * @param  approved     True if adding approval, false if removing approval.
     */
    function setSelector(
        address destination,
        bytes4 selector,
        bool approved
    )
        public
        onlyWallet
    {coverage_0x4fa1ff45(0x760a86c245360f50ba76be46b00a1b4cffc7dc93272ab632753991fc19873907); /* function */ 

coverage_0x4fa1ff45(0xcb83bbee081fdb20c948ecb05eec01c543f1e4b2b3ec0686f6069e7df284f91f); /* line */ 
        coverage_0x4fa1ff45(0x23d771e002166a82ac6bcea58e9abeace3b9240fe8da7318d9cb61cabe1a214d); /* statement */ 
instantData[destination][selector] = approved;
coverage_0x4fa1ff45(0xaa6727b7ae8d24e29c48bd49c0d53bf358b0ea113c795e49e72ba6dc9635dfd1); /* line */ 
        coverage_0x4fa1ff45(0x653834f9c2d2b159864fda73d68467bf3aaf2489126731f369d22079aa6606be); /* statement */ 
emit SelectorSet(destination, selector, approved);
    }

    // ============ Helper Functions ============

    /**
     * Returns true if transaction can be executed instantly (without timelock).
     */
    function txCanBeExecutedInstantly(
        uint256 transactionId
    )
        internal
        view
        returns (bool)
    {coverage_0x4fa1ff45(0x51111509994e39085f58018484f235ac1335373a79e3f953e80a8b30b3236bb1); /* function */ 

        // get transaction from storage
coverage_0x4fa1ff45(0xddf6ea01255e4cc9100a4707b40db69d0f370c25ea5e762719631a523cbce572); /* line */ 
        coverage_0x4fa1ff45(0xdc0abf9d627519c67999f9e9747b8101352d9db1ef9d62275108efbf92361316); /* statement */ 
Transaction memory txn = transactions[transactionId];
coverage_0x4fa1ff45(0x47bb0a3a007a052380b8c04911f7944af0e2c0b3d77b5ef29cbff2e7969a2ca0); /* line */ 
        coverage_0x4fa1ff45(0x6f6224b88d5fc54fb33f92527043d51ec0f75435524090ec628b0807fe3afe72); /* statement */ 
address dest = txn.destination;
coverage_0x4fa1ff45(0x0d20c33af763a4346a425894095be6290ff90407b291d2dd098193dcee4b4832); /* line */ 
        coverage_0x4fa1ff45(0x7ff4b0f9533334ca2a139a33ae9b5eb6e2c7fcdb14de2e6684ebb4cb6580ffe3); /* statement */ 
bytes memory data = txn.data;

        // fallback function
coverage_0x4fa1ff45(0x0abdf0e634b7a33f4b0a6a30ce7c0b34c94476d6c221ffffdd83fb947871e52e); /* line */ 
        coverage_0x4fa1ff45(0x8e944afc18d1164e233b330ad733578ddd9867b7e15312d80cef7b494ed8c305); /* statement */ 
if (data.length == 0) {coverage_0x4fa1ff45(0xf8f5462bc6d515c4faee392e03bace248e2ea63c88b4a8702e2c834258d41fd7); /* branch */ 

coverage_0x4fa1ff45(0x080b74538a16249be931da61138d1fb763877b32b4a9b71efe94f6daa839be6c); /* line */ 
            coverage_0x4fa1ff45(0x11eaff254d732a2168671c3c10ec37e82fb88691f9646de1e99ba34608c2719c); /* statement */ 
return selectorCanBeExecutedInstantly(dest, BYTES_ZERO);
        }else { coverage_0x4fa1ff45(0x28a3e32e2395fc4638e1d7b367972b7a7f14425c8b42843b076beb8e075a367e); /* branch */ 
}

        // invalid function selector
coverage_0x4fa1ff45(0x505c567e5d1dd544b0b44c93a79cd816f6692674511a0f68d574dab58043d681); /* line */ 
        coverage_0x4fa1ff45(0xddfd60adaa02a6e062af53dd63fea783aed212bf7fef4a93b984b21879137683); /* statement */ 
if (data.length < 4) {coverage_0x4fa1ff45(0x8291ea144bc4e29a27eefd8cdf49f4a5bc466a872283e5910e71c591140a0fbd); /* branch */ 

coverage_0x4fa1ff45(0xef129595ea39ab8ac3c277c2235cd2089f9d8bd7c8be7f7de194eeab3983f59c); /* line */ 
            coverage_0x4fa1ff45(0x9b9b0ec1ef7fcfc4aab3b00e393c8b114949f60863d3a74640e7ac79f52c3fdc); /* statement */ 
return false;
        }else { coverage_0x4fa1ff45(0xf6e93691fd6844882dab22d868f08e96ff74671e479e563230df9bd1aaf67a41); /* branch */ 
}

        // check first four bytes (function selector)
coverage_0x4fa1ff45(0x600c0386e26c743b56dbaa303da5851ef7f292891b99baa438b7398fe4facdb2); /* line */ 
        coverage_0x4fa1ff45(0x91bdb1a834968fe237791a5629ff9659c95026434530160f15bc27858d872f5c); /* statement */ 
bytes32 rawData;
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x4fa1ff45(0x277208c6bda05a02463540e8a008fe2741739e00ca08b0d4ff39b8cde08c5bfd); /* line */ 
        assembly {
            rawData := mload(add(data, 32))
        }
coverage_0x4fa1ff45(0x04f9181cb5b7c6c89b55b37507ecd39a782c6bd0d7ddb5bcbdbbfa6f3a81b72a); /* line */ 
        coverage_0x4fa1ff45(0x1ab26a54efee3591bfbf4c6be2e7752d275ec3740722f447b5b9681d787066b2); /* statement */ 
bytes4 selector = bytes4(rawData);

coverage_0x4fa1ff45(0xe980f5c372072827639d51ce856f19d5fbf75f3d41cbc0f7c11d3ac4ff69786b); /* line */ 
        coverage_0x4fa1ff45(0xeafcb418982014a3a3bfbd766917468b949154941eaf55d08d68a016d787d140); /* statement */ 
return selectorCanBeExecutedInstantly(dest, selector);
    }

    /**
     * Function selector is in instantData for address dest (or for address zero).
     */
    function selectorCanBeExecutedInstantly(
        address destination,
        bytes4 selector
    )
        internal
        view
        returns (bool)
    {coverage_0x4fa1ff45(0x4ecf81a5c3721b995798dd584d831cdef74d7da42bdf4ff33e2f7c0e8566c6d9); /* function */ 

coverage_0x4fa1ff45(0xad3820d58770f2b439a3f3fcd71beea9d33a94af454a69033a9cd23800595626); /* line */ 
        coverage_0x4fa1ff45(0x45d47bb2f0f19090630d16b25f3b44f1833efde32e18eebaa99cae9f6424b207); /* statement */ 
return instantData[destination][selector]
            || instantData[ADDRESS_ZERO][selector];
    }
}
