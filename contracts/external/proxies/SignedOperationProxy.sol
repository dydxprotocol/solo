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
import { ReentrancyGuard } from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
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
 * Contract for sending operations on others behalf
 */
contract SignedOperationProxy is
    OnlySolo,
    Ownable,
    ReentrancyGuard
{
    using SafeMath for uint256;

    // ============ Constants ============

    bytes32 constant internal FILE = "SignedOperationProxy";

    // EIP191 header for EIP712 prefix
    string constant internal EIP191_HEADER = "\x19\x01";

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "SignedOperationProxy";

    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1.0";

    // TODO: comment
    bytes constant internal EIP712_DOMAIN_STRING = abi.encodePacked(
        "EIP712Domain(",
        "string name,",
        "string version,",
        "uint256 chainId,",
        "address verifyingContract",
        ")"
    );

    // TODO: comment
    bytes constant internal EIP712_OPERATION_STRING = abi.encodePacked(
        "Operation(",
        "Action[] actions,",
        "uint256 expiration,",
        "uint256 salt,",
        "address sender",
        ")"
    );

    // TODO: comment
    bytes constant internal EIP712_ACTION_STRING = abi.encodePacked(
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

    // TODO: comment
    bytes constant internal EIP712_ASSET_AMOUNT_STRING = abi.encodePacked(
        "AssetAmount(",
        "bool sign,",
        "uint8 denomination,",
        "uint8 ref,",
        "uint256 value",
        ")"
    );

    // Hash of the EIP712 Domain Separator Schema
    /* solium-disable-next-line indentation */
    bytes32 constant internal EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        EIP712_DOMAIN_STRING
    ));

    // TODO: comment
    /* solium-disable-next-line indentation */
    bytes32 constant internal EIP712_OPERATION_HASH = keccak256(abi.encodePacked(
        EIP712_OPERATION_STRING,
        EIP712_ACTION_STRING,
        EIP712_ASSET_AMOUNT_STRING
    ));

    // TODO: comment
    /* solium-disable-next-line indentation */
    bytes32 constant internal EIP712_ACTION_HASH = keccak256(abi.encodePacked(
        EIP712_ACTION_STRING,
        EIP712_ASSET_AMOUNT_STRING
    ));

    // TODO: comment
    /* solium-disable-next-line indentation */
    bytes32 constant internal EIP712_ASSET_AMOUNT_HASH = keccak256(abi.encodePacked(
        EIP712_ASSET_AMOUNT_STRING
    ));

    // ============ Structs ============

    struct Proof {
        uint256 numActions;
        uint256 expiration;
        uint256 salt;
        address sender;
        bytes signature;
    }

    // ============ Events ============

    event ContractStatusSet(
        bool operational
    );

    event LogOperationExecuted(
        bytes32 indexed operationHash,
        address indexed signer
    );

    event LogOperationCanceled(
        bytes32 indexed operationHash,
        address indexed canceler
    );

    event LogOperationApproved(
        bytes32 indexed operationHash,
        address indexed approver
    );

    // ============ Immutable Storage ============

    // Hash of the EIP712 Domain Separator data
    bytes32 public EIP712_DOMAIN_HASH;

    // ============ Mutable Storage ============

     // true if this contract can process operationss
    bool public g_isOperational;

    // signer => final hash => was executed (or cancelled)
    mapping (address => mapping (bytes32 => bool)) public g_invalidated;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 chainId
    )
        public
        OnlySolo(soloMargin)
    {
        g_isOperational = true;

        /* solium-disable-next-line indentation */
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
    {
        g_isOperational = false;
        emit ContractStatusSet(false);
    }

     /**
     * The owner can start back up the exchange.
     */
    function startUp()
        external
        onlyOwner
    {
        g_isOperational = true;
        emit ContractStatusSet(true);
    }

    // ============ Public Functions ============

    /**
     * TODO: description
     */
    function cancel(
        bytes32 operationHash
    )
        external
    {
        g_invalidated[msg.sender][operationHash] = true;
        emit LogOperationCanceled(operationHash, msg.sender);
    }

    /**
     * TODO: description
     */
    function operate(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Proof[] memory proofs
    )
        public
        nonReentrant
    {
        // cache the index of the first action for this proof
        uint256 proofStartIndex = 0;

        // loop over all proofs
        for (uint256 p = 0; p < proofs.length; p++) {
            Proof memory proof = proofs[p];

            // require that the message is not expired
            Require.that(
                proof.expiration >= block.timestamp,
                FILE,
                "Signed message is expired"
            );

            // require that the sender is the sender
            Require.that(
                proof.sender == address(0) || proof.sender == msg.sender,
                FILE,
                "Sender mismatch"
            );

            // get the signer of the proof (msg.sender if no proof)
            address signer = getSigner(
                accounts,
                actions,
                proof,
                proofStartIndex
            );

            // cache the index of the first action after this proof
            uint256 proofEndIndex = proofStartIndex.add(proof.numActions);

            // loop over all actions for which this proof applies
            for (uint256 a = proofStartIndex; a < proofEndIndex; a++) {
                // validate primary account
                Actions.ActionArgs memory action = actions[a];
                validateAccountOwner(accounts[action.accountId].owner, signer);

                // validate second account in the case of a transfer action
                if (action.actionType == Actions.ActionType.Transfer) {
                    validateAccountOwner(accounts[action.otherAccountId].owner, signer);
                }
            }

            // update proofStartIndex
            proofStartIndex = proofEndIndex;
        }

        // require that all actions are signed or from msg.sender
        Require.that(
            proofStartIndex == actions.length,
            FILE,
            "Not all actions are signed"
        );

        // send the operation
        SOLO_MARGIN.operate(accounts, actions);
    }

    // ============ Private Helper Functions ============

    /**
     * TODO: description
     */
    function getSigner(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Proof memory proof,
        uint256 startIndex
    )
        private
        returns (address)
    {
        // consider msg.sender to be the signer in the case of empty signature
        if (proof.signature.length == 0) {
            return msg.sender;
        }

        // get the bytes32 hash of each action, then packed together
        bytes memory actionsBytes = getActionsBytes(
            accounts,
            actions,
            proof,
            startIndex
        );

        // compute the overall signed struct hash
        /* solium-disable-next-line indentation */
        bytes32 structHash = keccak256(abi.encode(
            EIP712_OPERATION_HASH,
            keccak256(actionsBytes),
            proof.expiration,
            proof.salt,
            proof.sender
        ));

        // compute eip712 compliant hash
        /* solium-disable-next-line indentation */
        bytes32 operationHash = keccak256(abi.encodePacked(
            EIP191_HEADER,
            EIP712_DOMAIN_HASH,
            structHash
        ));

        // get the signer
        address signer = TypedSignature.recover(operationHash, proof.signature);

        // require that this message is still valid
        Require.that(
            !g_invalidated[signer][operationHash],
            FILE,
            "Hash already used or cancelled",
            operationHash
        );

        // consider this hash signed
        g_invalidated[signer][operationHash] = true;
        emit LogOperationExecuted(operationHash, signer);

        return signer;
    }

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
    {
        bool valid =
            msg.sender == accountOwner
            || signer == accountOwner
            || SOLO_MARGIN.getIsLocalOperator(accountOwner, msg.sender)
            || SOLO_MARGIN.getIsLocalOperator(accountOwner, signer);

        Require.that(
            valid,
            FILE,
            "Invalid accountOwner",
            accountOwner
        );
    }

    /**
     * TODO: description
     */
    function getActionsBytes(
        Account.Info[] memory accounts,
        Actions.ActionArgs[] memory actions,
        Proof memory proof,
        uint256 startIndex
    )
        private
        pure
        returns (bytes memory)
    {
        // store in-memory sequential hash of each action
        bytes memory actionsBytes = new bytes(proof.numActions.mul(32));

        // create null account
        Account.Info memory nullAccount = Account.Info({ owner: address(0), number: 0 });

        // for each action that corresponds to the proof
        for (uint256 i = 0; i < proof.numActions; i++) {
            Actions.ActionArgs memory action = actions[startIndex + i];

            // if action type has no second account, assume null account
            Account.Info memory otherAccount =
                (Actions.getAccountLayout(action.actionType) == Actions.AccountLayout.OnePrimary)
                ? nullAccount
                : accounts[action.otherAccountId];

            // compute the individual hash for the action
            /* solium-disable-next-line indentation */
            bytes32 actionHash = getActionHash(
                action,
                accounts[action.accountId],
                otherAccount
            );

            // store actionHash in the actionBytes array
            /* solium-disable-next-line security/no-inline-assembly */
            assembly {
                mstore(add(actionsBytes, mul(0x20, add(i, 1))), actionHash)
            }
        }

        return actionsBytes;
    }

    /**
     * TODO: description
     */
    function getActionHash(
        Actions.ActionArgs memory action,
        Account.Info memory primaryAccount,
        Account.Info memory secondaryAccount
    )
        private
        pure
        returns (bytes32)
    {
        /* solium-disable-next-line indentation */
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
     * TODO: description
     */
    function getAssetAmountHash(
        Types.AssetAmount memory amount
    )
        private
        pure
        returns (bytes32)
    {
        /* solium-disable-next-line indentation */
        return keccak256(abi.encode(
            EIP712_ASSET_AMOUNT_HASH,
            amount.sign,
            amount.denomination,
            amount.ref,
            amount.value
        ));
    }
}
