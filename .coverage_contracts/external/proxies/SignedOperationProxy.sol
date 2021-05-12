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
import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";
import { TypedSignature } from "../lib/TypedSignature.sol";


/**
 * @title SignedOperationProxy
 * @author dYdX
 *
 * Contract for sending operations on behalf of others
 */
contract SignedOperationProxy is
    OnlySolo,
    Ownable
{
function coverage_0xe8286917(bytes32 c__0xe8286917) public pure {}

    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant private FILE = "SignedOperationProxy";

    // EIP191 header for EIP712 prefix
    bytes2 constant private EIP191_HEADER = 0x1901;

    // EIP712 Domain Name value
    string constant private EIP712_DOMAIN_NAME = "SignedOperationProxy";

    // EIP712 Domain Version value
    string constant private EIP712_DOMAIN_VERSION = "1.1";

    // EIP712 encodeType of EIP712Domain
    bytes constant private EIP712_DOMAIN_STRING = abi.encodePacked(
        "EIP712Domain(",
        "string name,",
        "string version,",
        "uint256 chainId,",
        "address verifyingContract",
        ")"
    );

    // EIP712 encodeType of Operation
    bytes constant private EIP712_OPERATION_STRING = abi.encodePacked(
        "Operation(",
        "Action[] actions,",
        "uint256 expiration,",
        "uint256 salt,",
        "address sender,",
        "address signer",
        ")"
    );

    // EIP712 encodeType of Action
    bytes constant private EIP712_ACTION_STRING = abi.encodePacked(
        "Action(",
        "uint8 actionType,",
        "address accountOwner,",
        "uint256 accountNumber,",
        "AssetAmount assetAmount,",
        "uint256 primaryMarketId,",
        "uint256 secondaryMarketId,",
        "address otherAddress,",
        "address otherAccountOwner,",
        "uint256 otherAccountNumber,",
        "bytes data",
        ")"
    );

    // EIP712 encodeType of AssetAmount
    bytes constant private EIP712_ASSET_AMOUNT_STRING = abi.encodePacked(
        "AssetAmount(",
        "bool sign,",
        "uint8 denomination,",
        "uint8 ref,",
        "uint256 value",
        ")"
    );

    // EIP712 typeHash of EIP712Domain
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        EIP712_DOMAIN_STRING
    ));

    // EIP712 typeHash of Operation
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_OPERATION_HASH = keccak256(abi.encodePacked(
        EIP712_OPERATION_STRING,
        EIP712_ACTION_STRING,
        EIP712_ASSET_AMOUNT_STRING
    ));

    // EIP712 typeHash of Action
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_ACTION_HASH = keccak256(abi.encodePacked(
        EIP712_ACTION_STRING,
        EIP712_ASSET_AMOUNT_STRING
    ));

    // EIP712 typeHash of AssetAmount
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_ASSET_AMOUNT_HASH = keccak256(abi.encodePacked(
        EIP712_ASSET_AMOUNT_STRING
    ));

    // ============ Structs ============

    struct OperationHeader {
        uint256 expiration;
        uint256 salt;
        address sender;
        address signer;
    }

    struct Authorization {
        uint256 numActions;
        OperationHeader header;
        bytes signature;
    }

    // ============ Events ============

    event ContractStatusSet(
        bool operational
    );

    event LogOperationExecuted(
        bytes32 indexed operationHash,
        address indexed signer,
        address indexed sender
    );

    event LogOperationCanceled(
        bytes32 indexed operationHash,
        address indexed canceler
    );

    // ============ Immutable Storage ============

    // Hash of the EIP712 Domain Separator data
    bytes32 public EIP712_DOMAIN_HASH;

    // ============ Mutable Storage ============

     // true if this contract can process operationss
    bool public g_isOperational;

    // operation hash => was executed (or canceled)
    mapping (bytes32 => bool) public g_invalidated;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 chainId
    )
        public
        OnlySolo(soloMargin)
    {coverage_0xe8286917(0xa83de4bf3b93f1bb3e3267ea0f383f41e3774b70b4259ae19ad19cc57f188ffd); /* function */ 

coverage_0xe8286917(0x66a02ca95c4f410ade7419d58680d0d0e25376e8c01e255f6bb2ab1bde8d0c3c); /* line */ 
        coverage_0xe8286917(0xe8b02553f2bf6855014fc68557a5d1d556731004fa9f9109df98be1597ec8c28); /* statement */ 
g_isOperational = true;

        /* solium-disable-next-line indentation */
coverage_0xe8286917(0x29ae730bd4706181f08f7d5af3e105d13322b4e0e99c49f728c257239a2da55c); /* line */ 
        coverage_0xe8286917(0x73792064d527e3d804d5dea584baeeadbe137b7aba0aa26316716d2f4f836bf2); /* statement */ 
EIP712_DOMAIN_HASH = keccak256(abi.encode(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            chainId,
            address(this)
        ));
    }

    // ============ Admin Functions ============

     /**
     * The owner can shut down the exchange.
     */
    function shutDown()
        external
        onlyOwner
    {coverage_0xe8286917(0x418ec0e5fd46d2538f9b7ea6cda815e2fd40b9cb521d9c25526c4d8c58709edb); /* function */ 

coverage_0xe8286917(0x99de670809bc23792fbf6bf13eaf2e55b62e5771b1df01a8d98e1676634d6cff); /* line */ 
        coverage_0xe8286917(0x6c03d158511c8367ed0f9a7a8b49cea9852d9e1fe4fc18aa1668dcae0e275c57); /* statement */ 
g_isOperational = false;
coverage_0xe8286917(0x5ea6645a064d87af7f206861962b8ac5c9b9b94f51f05a0d5eaaac3807105fb1); /* line */ 
        coverage_0xe8286917(0xa588db0f3176a9e752bb75f394de7d2b2087b968295140d8f6e60b52e3d44363); /* statement */ 
emit ContractStatusSet(false);
    }

     /**
     * The owner can start back up the exchange.
     */
    function startUp()
        external
        onlyOwner
    {coverage_0xe8286917(0xf54ce7d8c27f8e26e96afbe902e996803ebe1bdec2f5c8d3976e0e54f7459945); /* function */ 

coverage_0xe8286917(0x6d145aa0423d11e72bfae36bfa77e364bacac012e9270e695abd3f5f3b0a1539); /* line */ 
        coverage_0xe8286917(0x28ed397bab5f9d5f358403799781c7e11287a3967044ee20c0534888453da80b); /* statement */ 
g_isOperational = true;
coverage_0xe8286917(0xa0fafc3b3cee5412c5f1e99b8d2dfa7c9e43a4dfbaf53ce9d9af2bd37bb41bbd); /* line */ 
        coverage_0xe8286917(0xfbb34be4c847af760d8309e421cfc24f94b0066463e45d15323283cc82411555); /* statement */ 
emit ContractStatusSet(true);
    }

    // ============ Public Functions ============

    /**
     * Allows a signer to permanently cancel an operation on-chain.
     *
     * @param  accounts  The accounts involved in the operation
     * @param  actions   The actions involved in the operation
     * @param  auth      The unsigned authorization of the operation
     */
    function cancel(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Authorization memory auth
    )
        public
    {coverage_0xe8286917(0x24409d8d8f2f7e838c5645b9c5d0ab8a03976c7cbc2a57e0dce9f44fb1dfbbb6); /* function */ 

coverage_0xe8286917(0x9eeeb58ef24a44a02321363dceeea913d6501fc58e42937408a56a734032c670); /* line */ 
        coverage_0xe8286917(0x5e84cc1874abf07782e427bb9797bdebcf8f4c949bdb8ee8a8b7fd77d6aa4032); /* statement */ 
bytes32 operationHash = getOperationHash(
            accounts,
            actions,
            auth,
            0
        );
coverage_0xe8286917(0xbf3fe5d3b5c8d936064712a9b9972a94ab46a3a1779bda8e3c7658db5ded1b66); /* line */ 
        coverage_0xe8286917(0x5b8f065c7549d9be73658547098d89cf18a7506704d9cfc2a09b8edfc2459ef5); /* statement */ 
Require.that(
            auth.header.signer == msg.sender,
            FILE,
            "Canceler must be signer"
        );
coverage_0xe8286917(0x9a11ade6325ab2a391686cc03651992aa3d1cefb6644e194636d6fc812bbfc00); /* line */ 
        coverage_0xe8286917(0xb5ec697a08f5e4e98e932e03aad96bf59ec6f6227055486876b28ebfa53d62ac); /* statement */ 
g_invalidated[operationHash] = true;
coverage_0xe8286917(0x47df83b5fb0339cb23d59a0418c8a857846edc43d86e80f838c081ad7ecb5329); /* line */ 
        coverage_0xe8286917(0x2ad2e204496aa7b97b5a3acdd0ab398ecc67281bae16ce4e5fa2ca5c87446e35); /* statement */ 
emit LogOperationCanceled(operationHash, msg.sender);
    }

    /**
     * Submits an operation to SoloMargin. Actions for accounts that the msg.sender does not control
     * must be authorized by a signed message. Each authorization can apply to multiple actions at
     * once which must occur in-order next to each other. An empty authorization must be supplied
     * explicitly for each group of actions that do not require a signed message.
     *
     * @param  accounts  The accounts to forward to SoloMargin.operate()
     * @param  actions   The actions to forward to SoloMargin.operate()
     * @param  auths     The signed authorizations for each group of actions
     *                   (or unsigned if msg.sender is already authorized)
     */
    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Authorization[] memory auths
    )
        public
    {coverage_0xe8286917(0xee7f2b5de4bbc04815fdd0580668b0115a0be92dee7c6206b7e851cf2a77991d); /* function */ 

coverage_0xe8286917(0x7f99e6d8621d39fa7c91dde509db6f3c3a1c7b7822d7ae27954a4322425aa4c1); /* line */ 
        coverage_0xe8286917(0x6de3cf4bce950fe051f9926cada9e7198a1ba3a81b858b658b7719caa31d8474); /* statement */ 
Require.that(
            g_isOperational,
            FILE,
            "Contract is not operational"
        );

        // cache the index of the first action for this auth
coverage_0xe8286917(0x99c26774426a6fc35f9b6e0243c96a30ba33d27f4a6897aac6677dda6ab25dba); /* line */ 
        coverage_0xe8286917(0x10bdd35e8ba0e44eda3a755d42a421e6cbfe588f690b1ee72e778e061ac2aacc); /* statement */ 
uint256 actionStartIdx = 0;

        // loop over all auths
coverage_0xe8286917(0x4ac9b2e031128cd9f418481dd3f2067b0e72f1d9b410fae46812a0cc5956b7b4); /* line */ 
        coverage_0xe8286917(0xfffeebaad70a829812464b818f66696f37cf5ee8cbaad07b62f7b1fdc204f17a); /* statement */ 
for (uint256 authIdx = 0; authIdx < auths.length; authIdx++) {
coverage_0xe8286917(0x7af57163ce8530d637427adfc142dcb7849b90a0c1315cba86f31f6f48ddfb8d); /* line */ 
            coverage_0xe8286917(0x42803efc91a27cccff03ba0f8ef8941a77363e00aa6ea21cbdc0cb6b3a444ff8); /* statement */ 
Authorization memory auth = auths[authIdx];

            // require that the message is not expired
coverage_0xe8286917(0x9649b7ccba8c56f4b900ff3ebea452b63fad8fb0a5ebe3b549a2de6e5fafc170); /* line */ 
            coverage_0xe8286917(0x0ea70b9580e11cccd9f3c01c2933ec77e81254fa2ce5d471a410065ee1c27d87); /* statement */ 
Require.that(
                auth.header.expiration == 0 || auth.header.expiration >= block.timestamp,
                FILE,
                "Signed operation is expired",
                authIdx
            );

            // require that the sender matches the authorization
coverage_0xe8286917(0x986eb7e693fcf73986f2c5214110dde86fa87d6f662317edd487f602e92e6b9b); /* line */ 
            coverage_0xe8286917(0xdb15ae0fd10aea93a46046996e8b044048eda612f78a14b1eab01426f5a4dde9); /* statement */ 
Require.that(
                auth.header.sender == address(0) || auth.header.sender == msg.sender,
                FILE,
                "Operation sender mismatch",
                authIdx
            );

            // consider the signer to be msg.sender unless there is a signature
coverage_0xe8286917(0x3bb2b7eaa2b9b85bd64291c6ac2cea63c1956c6d97bef9b7ba0d8e89c07b1465); /* line */ 
            coverage_0xe8286917(0xdc600d919527b3e02d78015377c424e1d7bdb4e3d9ecd45c4c683a9187310c8f); /* statement */ 
address signer = msg.sender;

            // if there is a signature, then validate it
coverage_0xe8286917(0xce2593993f6bb0c0a0045dc1c7dd017ea014c071ba354b10b3c88ef41e05a24e); /* line */ 
            coverage_0xe8286917(0xf81e30e2d7775ef44d417c0fccb3de43554e9d86978f5a4afac53d15838c3bb3); /* statement */ 
if (auth.signature.length != 0) {coverage_0xe8286917(0x1e80fd1970128e69e5c7eb769b44e980161797390093c13d7b73eead02536cc3); /* branch */ 

                // get the hash of the operation
coverage_0xe8286917(0x15f8338512e0e27b764560cf9af912949a348a7b6db6d010745a78d50840f269); /* line */ 
                coverage_0xe8286917(0x1415ad7796482cd66853833c04956ed71de21e0267775a17a1a2571c2609dab3); /* statement */ 
bytes32 operationHash = getOperationHash(
                    accounts,
                    actions,
                    auth,
                    actionStartIdx
                );

                // require that this message is still valid
coverage_0xe8286917(0xb4a79e94ef04246b4a16d4d1712a6bd9824c8e97878a12271121a9e6f6343302); /* line */ 
                coverage_0xe8286917(0x106071034af1513a3b501d93a1b8691a11ec21e736a06ef4f87431f8ab7fc5b4); /* statement */ 
Require.that(
                    !g_invalidated[operationHash],
                    FILE,
                    "Hash already used or canceled",
                    operationHash
                );

                // get the signer
coverage_0xe8286917(0x5c37b75b195bd8cf1d0c78a2bc165aaa981b366985a173af6f045fb67fc2e33a); /* line */ 
                coverage_0xe8286917(0xab7321a011736a2d6c75267debef8279e75e0c303489323fc97a0dddf46eb372); /* statement */ 
signer = TypedSignature.recover(operationHash, auth.signature);

                // require that this signer matches the authorization
coverage_0xe8286917(0x9e47794d80352364f0d42e1b3b056686df46a079ac68d6de7b15942cb7ebae3e); /* line */ 
                coverage_0xe8286917(0x629588d576a493953c9cf49963cd022d0a685405353f0b43c8d1c2e46a818654); /* statement */ 
Require.that(
                    auth.header.signer == signer,
                    FILE,
                    "Invalid signature"
                );

                // consider this operationHash to be used (and therefore no longer valid)
coverage_0xe8286917(0xf46523ad9bade1de4f7650ac918935eefc07c76af326ee15b9eb82c47b4c95da); /* line */ 
                coverage_0xe8286917(0xaa88174bb1ed01fe752958bd2071d961e00a7375854f659e0818beb947625336); /* statement */ 
g_invalidated[operationHash] = true;
coverage_0xe8286917(0xfd8e8d2ca410b461df8de728e276e79508d643f5e5b332549232a5fa76208eed); /* line */ 
                coverage_0xe8286917(0xc4089e04f45055bd798f75e637e11727f6010446f8e70de54366369024ebf3e1); /* statement */ 
emit LogOperationExecuted(operationHash, signer, msg.sender);
            }else { coverage_0xe8286917(0xb7838814a6903af26f94f731c064c05f724985aeb611743e1fe94e6ace9a1a26); /* branch */ 
}

            // cache the index of the first action after this auth
coverage_0xe8286917(0xe155ed606aa40d4a38f0eb10c5e9cbe4d6f328c5b35eb721d276e9f05e754b7e); /* line */ 
            coverage_0xe8286917(0xba8a4774b0795081396e51e0d10bd192dcb667ab3d752a7bc4d36c3e3c58b7df); /* statement */ 
uint256 actionEndIdx = actionStartIdx.add(auth.numActions);

            // loop over all actions for which this auth applies
coverage_0xe8286917(0x7925c1ff0ec67ff4edc0fdef3f784d2fe630d15b60358a3d4f7e45a981132702); /* line */ 
            coverage_0xe8286917(0xbec6574847832cead4b58dec77be4445208f2cb346e1bf0b19a0e0e393fc4dc8); /* statement */ 
for (uint256 actionIdx = actionStartIdx; actionIdx < actionEndIdx; actionIdx++) {
                // validate primary account
coverage_0xe8286917(0x1f19a36d3610d479dbe4926bad6cd1489a6d5be69f98cc794940e41a2e3a9781); /* line */ 
                coverage_0xe8286917(0xbd03aace25312a3a023e41b9304736cd2a6c73d628ff22e7930d5e160bd0af31); /* statement */ 
Actions.ActionArgs memory action = actions[actionIdx];
coverage_0xe8286917(0xcd39ead05a16171f4ae72bd304800b1bdb08d63d84c499d73fc14055fd0bf598); /* line */ 
                coverage_0xe8286917(0xeda6ad1ccad9d77db5d0646d1169179d9b2bf61e708fee6a80ba180d0aa5ba4f); /* statement */ 
validateAccountOwner(accounts[action.accountId].owner, signer);

                // validate second account in the case of a transfer
coverage_0xe8286917(0x610d58bc59a76a58f27da3a154a1b288da406b024d8aa4d3ff49365819152c34); /* line */ 
                coverage_0xe8286917(0xcbc1b4425a527758674fcdeb9e044afdc7c69008bb1b3d272e8e0152ccd67957); /* statement */ 
if (action.actionType == Actions.ActionType.Transfer) {coverage_0xe8286917(0xb6de3515ea9a0d966a54c39bda29c3484f4eaec68d0e4f94589f220a38909b11); /* branch */ 

coverage_0xe8286917(0x5d17425bc5b45cee606b67f986bdce03067e13151239a514bc3f4a06c7a5b489); /* line */ 
                    coverage_0xe8286917(0x9b9a29ce08c327a4da901c8c5715dfb7a5106e15dc08df9ce2a8fc50df3f3fce); /* statement */ 
validateAccountOwner(accounts[action.otherAccountId].owner, signer);
                }else { coverage_0xe8286917(0x9c1dc76caa10ec919466cdab63e4d054f7fbd0b5fe980089559e12b69939f3d6); /* branch */ 
}
            }

            // update actionStartIdx
coverage_0xe8286917(0xf4ec5318cb15123da1a2ed4f1f874c69f29ae2311fefb2d6943ba52960601f97); /* line */ 
            coverage_0xe8286917(0xaf44b50647f6a1fd458ce27e492e2923c2a9f6027dc368158776d3424b2736a7); /* statement */ 
actionStartIdx = actionEndIdx;
        }

        // require that all actions are signed or from msg.sender
coverage_0xe8286917(0xee95a2f60c46d4cb27458da1c2bccac39e5c746c1cc55219a34bf64229e01f75); /* line */ 
        coverage_0xe8286917(0x906df5231bf152e8681eb807462850981ad2e6b42f70e6718f46d7e21fdb4e85); /* statement */ 
Require.that(
            actionStartIdx == actions.length,
            FILE,
            "Not all actions are signed"
        );

        // send the operation
coverage_0xe8286917(0x5ab37ce0d2921bd854b20e70964a25c548869895758fabe4ba4b7121c9267aa6); /* line */ 
        coverage_0xe8286917(0xa85979d3e35911c6215677c4ffb59aaa06ef2187863dbd994d4039041a0b3773); /* statement */ 
SOLO_MARGIN.operate(accounts, actions);
    }

    // ============ Getters ============

    /**
     * Returns a bool for each operation. True if the operation is invalid (from being canceled or
     * previously executed).
     */
    function getOperationsAreInvalid(
        bytes32[] memory operationHashes
    )
        public
        view
        returns(bool[] memory)
    {coverage_0xe8286917(0x07f256005db864a05b298e2f80ae8a5cafa7a843bb68e56ce64eadf258570974); /* function */ 

coverage_0xe8286917(0xef0cbc03d1be0cad57ba259180c988228556dec05f6fbf2f3c52d1ab72bbaf6e); /* line */ 
        coverage_0xe8286917(0x5b30810ae123cefa56b8b02b9c679fa31b3bfd50bad9763c94d00606533e6bae); /* statement */ 
uint256 numOperations = operationHashes.length;
coverage_0xe8286917(0xddcc2c82a7c6e90933e876293a2b2939071098c57b16788642669e7cb580a5d4); /* line */ 
        coverage_0xe8286917(0x3187a5073e5ab5bdd783a734c103d69f097ca504cfc0e50e8ca634a505d022bf); /* statement */ 
bool[] memory output = new bool[](numOperations);

coverage_0xe8286917(0x995469881ade7d2df7c1161442138692fe11153dd01eafc1d01aea51bd103fb6); /* line */ 
        coverage_0xe8286917(0x10df9f47c353b37489e64e87218a9e9ed3e889c5cadec336bdb83efeb56d0ea5); /* statement */ 
for (uint256 i = 0; i < numOperations; i++) {
coverage_0xe8286917(0x357818e4b4684ec4c373a8ff85d972331861681e984c7417fde19fbe78cec728); /* line */ 
            coverage_0xe8286917(0xe9478533e943a718f579550b4c51037c88f9dceb06bc8cacbc4fc6847b058786); /* statement */ 
output[i] = g_invalidated[operationHashes[i]];
        }
coverage_0xe8286917(0x43fe43f5b613cf545d844ff9fac823ead99b8767b5fb5d0d1aee614b2a9dbb33); /* line */ 
        coverage_0xe8286917(0xcc24c1b24397ca4d43d9735e093ce824a4d550d87be8e82926315868bf1db15c); /* statement */ 
return output;
    }

    // ============ Private Helper Functions ============

    /**
     * Validates that either the signer or the msg.sender are the accountOwner (or that either are
     * localOperators of the accountOwner).
     */
    function validateAccountOwner(
        address accountOwner,
        address signer
    )
        private
        view
    {coverage_0xe8286917(0xf45f13b0b1cde045c027d55379d49433bfc84521bb2badcf37b870b7d878cebe); /* function */ 

coverage_0xe8286917(0x765a4eb2683e9948e947f9b97388a76bf5193843fc3fc0d83ab26f15162f0907); /* line */ 
        coverage_0xe8286917(0x96e295f402c24af4b7fc39442826839cafd2751704a4cbfa9f9d63c3f949c748); /* statement */ 
bool valid =
            msg.sender == accountOwner
            || signer == accountOwner
            || SOLO_MARGIN.getIsLocalOperator(accountOwner, msg.sender)
            || SOLO_MARGIN.getIsLocalOperator(accountOwner, signer);

coverage_0xe8286917(0x036422f7cad0f68625fd874ed95013cc1f877e9b3996db3fe9d854ca1e34469e); /* line */ 
        coverage_0xe8286917(0x7079c2613a73d307e9144cd3d401b840468ee675c1764f40e23005178927a618); /* statement */ 
Require.that(
            valid,
            FILE,
            "Signer not authorized",
            signer
        );
    }

    /**
     * Returns the EIP712 hash of an Operation message.
     */
    function getOperationHash(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Authorization memory auth,
        uint256 startIdx
    )
        private
        view
        returns (bytes32)
    {coverage_0xe8286917(0xe532b932a919bc16b9ef25eb6997cfe9ad77ca9f036c2054a8499add3222d27a); /* function */ 

        // get the bytes32 hash of each action, then packed together
coverage_0xe8286917(0xbab4c7eb988a0e446eb8e815164a57d3f013cbb8102099af27137ee7f4cc667e); /* line */ 
        coverage_0xe8286917(0xf5e4052769d665578cd934e583edf7117a33d86d02b9ff413c1d0e7c0d0aa149); /* statement */ 
bytes32 actionsEncoding = getActionsEncoding(
            accounts,
            actions,
            auth,
            startIdx
        );

        // compute the EIP712 hashStruct of an Operation struct
        /* solium-disable-next-line indentation */
coverage_0xe8286917(0xad3f7dcbfee9d0bb939f77b9fc9e9f12336ebef9b2adabacecb5bab4dd1c6281); /* line */ 
        coverage_0xe8286917(0xcbdd9384b4e27a70a9c1993635c3e4f1c9b38b4af8d8bf7db40d3a9b423739ad); /* statement */ 
bytes32 structHash = keccak256(abi.encode(
            EIP712_OPERATION_HASH,
            actionsEncoding,
            auth.header
        ));

        // compute eip712 compliant hash
        /* solium-disable-next-line indentation */
coverage_0xe8286917(0xe81d503b90e07ea823441d493865603be951c63e51d07038ad04c16521a1f3ea); /* line */ 
        coverage_0xe8286917(0xa5d1c151861c4cb52d415dd5666d22f48b16c0a4810e5bec85c36ad289e0d89e); /* statement */ 
return keccak256(abi.encodePacked(
            EIP191_HEADER,
            EIP712_DOMAIN_HASH,
            structHash
        ));
    }

    /**
     * Returns the EIP712 encodeData of an Action struct array.
     */
    function getActionsEncoding(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Authorization memory auth,
        uint256 startIdx
    )
        private
        pure
        returns (bytes32)
    {coverage_0xe8286917(0x10f445fdea562d5853af8306ae92bbcb913ffaebaa029f0c95565d66c82c1bf1); /* function */ 

        // store hash of each action
coverage_0xe8286917(0xdbee90eaddc2f8c1f057fce3f25f55f605f44979fbb466b38d987e2f0303907a); /* line */ 
        coverage_0xe8286917(0x009c6fb0abd21db45bf73f88f115b29d7d25ec69cb87bcccee24d97fe650f8d7); /* statement */ 
bytes32[] memory actionsBytes = new bytes32[](auth.numActions);

        // for each action that corresponds to the auth
coverage_0xe8286917(0x499f6742dbcdde8399ec76b5df08dae33aa02ee96d8a4f11c664a146f571c848); /* line */ 
        coverage_0xe8286917(0x131554887986eb2f8b587859679ee2b1bc8c9600ea8b8d5d1eac8b9f3def82d4); /* statement */ 
for (uint256 i = 0; i < auth.numActions; i++) {
coverage_0xe8286917(0x1f8ebbc6843824c92d937bd43ef629a5e5be5e1394fd68b584c37b2e7771ed7d); /* line */ 
            coverage_0xe8286917(0x509b2c7ef25088d7222772a64ed3f95199aa6901540dae4f78c4c9d559d9c94b); /* statement */ 
Actions.ActionArgs memory action = actions[startIdx + i];

            // if action type has no second account, assume null account
coverage_0xe8286917(0x9acc6b6db38791a69491d66c1db6e5d41621b2f71e6f2aba496dcce4b5815d9d); /* line */ 
            coverage_0xe8286917(0x26da9334d24f7d9d7215860596b1a8c12c405d77af8f97151680e9073b45e403); /* statement */ 
Account.Info memory otherAccount =
                (Actions.getAccountLayout(action.actionType) == Actions.AccountLayout.OnePrimary)
                ? Account.Info({ owner: address(0), number: 0 })
                : accounts[action.otherAccountId];

            // compute the individual hash for the action
            /* solium-disable-next-line indentation */
coverage_0xe8286917(0xad31c05fb688266005c29523d290aef91191c1d9db633046c4a8dc1f455daf61); /* line */ 
            coverage_0xe8286917(0xa9983180ed4ca9201d8e791bb0bfd2242523055cb36be3fc4ce297a992893510); /* statement */ 
actionsBytes[i] = getActionHash(
                action,
                accounts[action.accountId],
                otherAccount
            );
        }

coverage_0xe8286917(0x14eb9b5c994a9152bad6e6998ba3f727f661c00b52b49fedf90b5051efea49dc); /* line */ 
        coverage_0xe8286917(0xc6b7e5ec467994f574b2e092b80604a346e1f1bb4fff65708086ada0ec39d68d); /* statement */ 
return keccak256(abi.encodePacked(actionsBytes));
    }

    /**
     * Returns the EIP712 hashStruct of an Action struct.
     */
    function getActionHash(
        Actions.ActionArgs memory action,
        Account.Info memory primaryAccount,
        Account.Info memory secondaryAccount
    )
        private
        pure
        returns (bytes32)
    {coverage_0xe8286917(0x552a9d8e3da11a43d1629f327dd4b6c5d00baa4762f17dad78c0dfcfb3bd4a3a); /* function */ 

        /* solium-disable-next-line indentation */
coverage_0xe8286917(0x3cc8006d662e492e6aa18cbfb33771e190c2126780a545bf6d194683834293c5); /* line */ 
        coverage_0xe8286917(0x111d316da8f40e5642979bc86fe831858c0711847228c5ce07edc158510e5ee7); /* statement */ 
return keccak256(abi.encode(
            EIP712_ACTION_HASH,
            action.actionType,
            primaryAccount.owner,
            primaryAccount.number,
            getAssetAmountHash(action.amount),
            action.primaryMarketId,
            action.secondaryMarketId,
            action.otherAddress,
            secondaryAccount.owner,
            secondaryAccount.number,
            keccak256(action.data)
        ));
    }

    /**
     * Returns the EIP712 hashStruct of an AssetAmount struct.
     */
    function getAssetAmountHash(
        Types.AssetAmount memory amount
    )
        private
        pure
        returns (bytes32)
    {coverage_0xe8286917(0xd7c074c12c61889cc583b6b65bb358105177e8a3bb0eb787ae3198b8096df1e7); /* function */ 

        /* solium-disable-next-line indentation */
coverage_0xe8286917(0x8453a81b7cbc10786ba4d4742cf8fd914e0933d099212d0bec80bd4bc1cc4c1e); /* line */ 
        coverage_0xe8286917(0x0930be071b6704c011b22ae6cffea298d4e48741c2db99b5a246a98f19983d9a); /* statement */ 
return keccak256(abi.encode(
            EIP712_ASSET_AMOUNT_HASH,
            amount.sign,
            amount.denomination,
            amount.ref,
            amount.value
        ));
    }
}
