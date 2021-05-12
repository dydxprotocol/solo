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
import { Math } from "../../protocol/lib/Math.sol";
import { Monetary } from "../../protocol/lib/Monetary.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";
import { TypedSignature } from "../lib/TypedSignature.sol";


/**
 * @title StopLimitOrders
 * @author dYdX
 *
 * Allows for Stop-Limit Orders to be used with dYdX
 */
contract StopLimitOrders is
    Ownable,
    OnlySolo,
    IAutoTrader,
    ICallee
{
function coverage_0x30fda961(bytes32 c__0x30fda961) public pure {}

    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant private FILE = "StopLimitOrders";

    // EIP191 header for EIP712 prefix
    bytes2 constant private EIP191_HEADER = 0x1901;

    // EIP712 Domain Name value
    string constant private EIP712_DOMAIN_NAME = "StopLimitOrders";

    // EIP712 Domain Version value
    string constant private EIP712_DOMAIN_VERSION = "1.1";

    // Hash of the EIP712 Domain Separator Schema
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(abi.encodePacked(
        "EIP712Domain(",
        "string name,",
        "string version,",
        "uint256 chainId,",
        "address verifyingContract",
        ")"
    ));

    // Hash of the EIP712 StopLimitOrder struct
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_ORDER_STRUCT_SCHEMA_HASH = keccak256(abi.encodePacked(
        "StopLimitOrder(",
        "uint256 makerMarket,",
        "uint256 takerMarket,",
        "uint256 makerAmount,",
        "uint256 takerAmount,",
        "address makerAccountOwner,",
        "uint256 makerAccountNumber,",
        "address takerAccountOwner,",
        "uint256 takerAccountNumber,",
        "uint256 triggerPrice,",
        "bool decreaseOnly,",
        "uint256 expiration,",
        "uint256 salt",
        ")"
    ));

    // Number of bytes in an Order struct
    uint256 constant private NUM_ORDER_BYTES = 384;

    // Number of bytes in a typed signature
    uint256 constant private NUM_SIGNATURE_BYTES = 66;

    // Number of bytes in a CallFunctionData struct
    uint256 constant private NUM_CALLFUNCTIONDATA_BYTES = 32 + NUM_ORDER_BYTES;

    // The number of decimal places of precision in the price ratio of a triggerPrice
    uint256 PRICE_BASE = 10 ** 18;

    // ============ Enums ============

    enum OrderStatus {
        Null,
        Approved,
        Canceled
    }

    enum CallFunctionType {
        Approve,
        Cancel
    }

    // ============ Structs ============

    struct Order {
        uint256 makerMarket;
        uint256 takerMarket;
        uint256 makerAmount;
        uint256 takerAmount;
        address makerAccountOwner;
        uint256 makerAccountNumber;
        address takerAccountOwner;
        uint256 takerAccountNumber;
        uint256 triggerPrice;
        bool decreaseOnly;
        uint256 expiration;
        uint256 salt;
    }

    struct OrderInfo {
        Order order;
        bytes32 orderHash;
    }

    struct CallFunctionData {
        CallFunctionType callType;
        Order order;
    }

    struct OrderQueryOutput {
        OrderStatus orderStatus;
        uint256 orderMakerFilledAmount;
    }

    // ============ Events ============

    event ContractStatusSet(
        bool operational
    );

    event LogStopLimitOrderCanceled(
        bytes32 indexed orderHash,
        address indexed canceler,
        uint256 makerMarket,
        uint256 takerMarket
    );

    event LogStopLimitOrderApproved(
        bytes32 indexed orderHash,
        address indexed approver,
        uint256 makerMarket,
        uint256 takerMarket
    );

    event LogStopLimitOrderFilled(
        bytes32 indexed orderHash,
        address indexed orderMaker,
        uint256 makerFillAmount,
        uint256 totalMakerFilledAmount
    );

    // ============ Immutable Storage ============

    // Hash of the EIP712 Domain Separator data
    bytes32 public EIP712_DOMAIN_HASH;

    // ============ Mutable Storage ============

    // true if this contract can process orders
    bool public g_isOperational;

    // order hash => filled amount (in makerAmount)
    mapping (bytes32 => uint256) public g_makerFilledAmount;

    // order hash => status
    mapping (bytes32 => OrderStatus) public g_status;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 chainId
    )
        public
        OnlySolo(soloMargin)
    {coverage_0x30fda961(0x9cfac9d9f5276011a566d74416230318f81e66099b5054f223bcc52e76af9cd8); /* function */ 

coverage_0x30fda961(0x49396e2906cd973ad625923e2460c83e66525a65af4f3c7ba0dd12042347d9f6); /* line */ 
        coverage_0x30fda961(0xae600be3db5d60dc1ce2dbf3e97d1f646eade9d697c927e2ffda9904c568a4d2); /* statement */ 
g_isOperational = true;

        /* solium-disable-next-line indentation */
coverage_0x30fda961(0x11cc75bb58fb78c3463c85c94618e3d6c9571406b91ae6b303a1b3fa7501608e); /* line */ 
        coverage_0x30fda961(0x1173d9fd3ffe52ebb1596ef263a4ce27e9181029ebd590aa4761143a99a23693); /* statement */ 
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
    {coverage_0x30fda961(0x93d2dd2fb00bc3c9dcd6ff5966ef7ee04e857fe0197abb3f19cd59f2ce74206c); /* function */ 

coverage_0x30fda961(0xbc5e2617a666077ac82081b6b77b131f39d4b3ed9f8317b581d36c3a08214a09); /* line */ 
        coverage_0x30fda961(0xe225c113d30fae92b7a18a79ce19ab4b16115275a97de007c8293202f1ebb9cc); /* statement */ 
g_isOperational = false;
coverage_0x30fda961(0xc13285dc59f8f29caf2cca592e84c6b06b41791de763896aff0a2c89030a7adc); /* line */ 
        coverage_0x30fda961(0xc1165e2b57be18133d58568d23e3bab71e43e7b48695a39ff4ff27a0dacf694a); /* statement */ 
emit ContractStatusSet(false);
    }

    /**
     * The owner can start back up the exchange.
     */
    function startUp()
        external
        onlyOwner
    {coverage_0x30fda961(0x2a9f2a7011de71b2c40fa23f213480a116af38f5a5085fd047059d7a6aba2685); /* function */ 

coverage_0x30fda961(0x0ea5b0e92ac2bd02fa35e5b6cd45293dedd660545478ebe16f55b7f149ab40c6); /* line */ 
        coverage_0x30fda961(0x3edb4c51be23eefd45c0bcd1067b767cc3041b2559bb443ccaf82744eafdd372); /* statement */ 
g_isOperational = true;
coverage_0x30fda961(0x2e70c4cb2bd1fab430877abf5038633aed6dac8c9f0a4e43425b2de9e1086d7e); /* line */ 
        coverage_0x30fda961(0xbc67703307aa6cf756a14ed71b3d99d518ded64203311eae4e494a6dfafe590c); /* statement */ 
emit ContractStatusSet(true);
    }

    // ============ External Functions ============

    /**
     * Cancels an order. Cannot already be canceled.
     *
     * @param  order  The order to cancel
     */
    function cancelOrder(
        Order memory order
    )
        public
    {coverage_0x30fda961(0xd0824ceeb028cbc2b97fe087747bf7363186fdbecab37aae7e6c003087a3b5c6); /* function */ 

coverage_0x30fda961(0x4f56db28ce1e8d999494cb35b3c444e9be466ee1b93cc9e60e1b4e7a5f5cb6d5); /* line */ 
        coverage_0x30fda961(0x14269e84a4e7e7177c6636bb2bc27b9623840e82f4ec76ba2f5e3450d8109f46); /* statement */ 
cancelOrderInternal(msg.sender, order);
    }

    /**
     * Approves an order. Cannot already be approved or canceled.
     *
     * @param  order  The order to approve
     */
    function approveOrder(
        Order memory order
    )
        public
    {coverage_0x30fda961(0x1c127d1d48c7c583da42c6c20a8a9009cffdd7d2f90318f9145d6591a572ffe9); /* function */ 

coverage_0x30fda961(0x90ba00d8d049b9196877ca04d5718a25f92e448dcc6b5ffaaf8d8b4f7e61a947); /* line */ 
        coverage_0x30fda961(0x8b1cc08d7dc635558dc9e971d05815681a1140ed96590c8dcc2a394fa841b90a); /* statement */ 
approveOrderInternal(msg.sender, order);
    }

    // ============ Only-Solo Functions ============

    /**
     * Allows traders to make trades approved by this smart contract. The active trader's account is
     * the takerAccount and the passive account (for which this contract approves trades
     * on-behalf-of) is the makerAccount.
     *
     * @param  inputMarketId   The market for which the trader specified the original amount
     * @param  outputMarketId  The market for which the trader wants the resulting amount specified
     * @param  makerAccount    The account for which this contract is making trades
     * @param  takerAccount    The account requesting the trade
     * @param  oldInputPar     The par balance of the makerAccount for inputMarketId pre-trade
     * @param  newInputPar     The par balance of the makerAccount for inputMarketId post-trade
     * @param  inputWei        The change in token amount for the makerAccount for the inputMarketId
     * @param  data            Arbitrary data passed in by the trader
     * @return                 The AssetAmount for the makerAccount for the outputMarketId
     */
    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {coverage_0x30fda961(0x30f68543beeada805e79dcdc1badb87f3b08776346fda86a0eb9c672136e1c4f); /* function */ 

coverage_0x30fda961(0x243989bc604ae01c119d01c9d3587548b8b4f25c14f9aa1afc4d0a76f62b07f0); /* line */ 
        coverage_0x30fda961(0x0e45211343abf2d4513c2bf3c3c52e43b94e4bdbb77f73cd2025ffb64c8076de); /* statement */ 
Require.that(
            g_isOperational,
            FILE,
            "Contract is not operational"
        );

coverage_0x30fda961(0x16e3519596ccfcf6d023e8a7cfaba0860c7e9980214214c87758de8e8cc7c727); /* line */ 
        coverage_0x30fda961(0x167428756bfb0e0b574423646a5c0049e2e42b4d72856ef0dc9dc8fc56163980); /* statement */ 
OrderInfo memory orderInfo = getOrderAndValidateSignature(data);

coverage_0x30fda961(0x5cc52748c98332a6c422f75d5864164f7a3e62f55c058adae89be7fff51d6b42); /* line */ 
        coverage_0x30fda961(0x470faddc7064c220d9ffa8988e80cd355e0f969c770378410436aac30f4197b6); /* statement */ 
verifyOrderAndAccountsAndMarkets(
            orderInfo,
            makerAccount,
            takerAccount,
            inputMarketId,
            outputMarketId,
            inputWei
        );

coverage_0x30fda961(0x6ad611a95088858c5cb16c377346ce0af8ff51e60aced32512925e95ae0f99f5); /* line */ 
        coverage_0x30fda961(0xc5d06dd516eee82b26e091203bb1f78e43e4281b124d1197a70bf4bce3bc3ab3); /* statement */ 
Types.AssetAmount memory assetAmount = getOutputAssetAmount(
            inputMarketId,
            outputMarketId,
            inputWei,
            orderInfo
        );

coverage_0x30fda961(0xc5f58ea7062ca4696a8eae09daa7a60d51591747334be3595140f67caf2170f0); /* line */ 
        coverage_0x30fda961(0x1c2b30b34d4c442aa3bbd8b1390cae700d4fe96c78df80b7d3ef196f08d3ce61); /* statement */ 
if (orderInfo.order.decreaseOnly) {coverage_0x30fda961(0x0ec8161cfe8fb08eb21861c160bc4a25527f4f6256524df72bc9eaa8f5d2c94a); /* branch */ 

coverage_0x30fda961(0x163054fd591a4c172a709966f7c63d39b060009e8256d35b2a9a450d5bd6fe7d); /* line */ 
            coverage_0x30fda961(0x251ebfc3c6e2f2459a7d16a75f41b45ac6c31751a7209a46bd90a2f47d7231a2); /* statement */ 
verifyDecreaseOnly(
                oldInputPar,
                newInputPar,
                assetAmount,
                makerAccount,
                outputMarketId
            );
        }else { coverage_0x30fda961(0xf54ed380ddc2abac7b49522f9c6426a138915f5c28a56820724d26d620c77b28); /* branch */ 
}

coverage_0x30fda961(0xaeabc42ff997a2781f86e25b618c05cc6eda07a9a0d73fd9b51a76bcb5dbb9cb); /* line */ 
        coverage_0x30fda961(0x1922028604b15753a83c5e6d1256aad76ff8e8a4a42329101681c4020109e9f9); /* statement */ 
return assetAmount;
    }

    /**
     * Allows users to send this contract arbitrary data.
     *
     *  param  sender       (unused)
     * @param  accountInfo  The account from which the data is being sent
     * @param  data         Arbitrary data given by the sender
     */
    function callFunction(
        address /* sender */,
        Account.Info memory accountInfo,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {coverage_0x30fda961(0x9ab766d68202690ced40064941f36e5202ae6cf6d743b7064a9eb91e1cf4f1fe); /* function */ 

coverage_0x30fda961(0xc5734dabd38542ae5c5e34d2b4cca8c1a90ffd54ddb4a90bb6c80efe03fcbb9a); /* line */ 
        coverage_0x30fda961(0x3bbcd5f552c9472a0d223a742b241ba96139328d57f226c42b6a81cb558e80b4); /* statement */ 
Require.that(
            data.length == NUM_CALLFUNCTIONDATA_BYTES,
            FILE,
            "Cannot parse CallFunctionData"
        );

coverage_0x30fda961(0x6b542fb43afe7b19cd7f50d5ce74c9061fdddc416e572f891879feae63960bb4); /* line */ 
        coverage_0x30fda961(0x67a85fea5be67d91d01850bf030df89f606f8d8ef2ecb89e7c380e47cb6e5763); /* statement */ 
CallFunctionData memory cfd = abi.decode(data, (CallFunctionData));

coverage_0x30fda961(0x074ca63504642819c931d926d4ccfe0afa7a7c7c0c65dcb4140885a20883e8a3); /* line */ 
        coverage_0x30fda961(0x8f8ffb7e003aa3d48960bddce099575f2a8239e0ac817d11c17b311873b153cb); /* statement */ 
if (cfd.callType == CallFunctionType.Approve) {coverage_0x30fda961(0xdcb9bc8df87122aa9c63007b9da60b04fca15d63f4270495d15f1c8105636a90); /* branch */ 

coverage_0x30fda961(0xbc759101eefcecd7e084e9dda826b10c192fc5e1159c6b635b32fb445b5940d1); /* line */ 
            coverage_0x30fda961(0x93300fe53b0650e0581a4ee342de45e16574043a22f80b2f7802f66373abffb7); /* statement */ 
approveOrderInternal(accountInfo.owner, cfd.order);
        } else {coverage_0x30fda961(0xb7c0408a61ce845af5aea9ecdcf37a1816a8b121f6de88a14fe1eaba578172c4); /* branch */ 

coverage_0x30fda961(0x19ccfa78807ff0647aaedc3612a1083b3638282e1ca5d850dd84dcec445b5632); /* line */ 
            coverage_0x30fda961(0xec54af33b224785fa8ec59dc9cb7522140c793cc6e940077e330441a5a4b0cf4); /* assertPre */ 
coverage_0x30fda961(0x1af41dd2659285dbe7a134fab77e5fe40110d885675805eb8daa61ef4a1a6de0); /* statement */ 
assert(cfd.callType == CallFunctionType.Cancel);coverage_0x30fda961(0xea1570b4dd0daf6fa106b4b5982914f535db98568acd0ecbd8722ebe7e77b3a0); /* assertPost */ 

coverage_0x30fda961(0xb3fab27df70d598f549108385ee0a50c092742a078bab640ec2af98dc8b0b9ac); /* line */ 
            coverage_0x30fda961(0x7a343b5898273dc6278c6260b5a5525a0ce2eba315f708e6e7d2a4b67e3a2ee0); /* statement */ 
cancelOrderInternal(accountInfo.owner, cfd.order);
        }
    }

    // ============ Getters ============

    /**
     * Returns the status and the filled amount (in makerAmount) of several orders.
     */
    function getOrderStates(
        bytes32[] memory orderHashes
    )
        public
        view
        returns(OrderQueryOutput[] memory)
    {coverage_0x30fda961(0x004f43eec91f24202c4b36f6e168f178095bbc98ba26c5a65473789888b7644a); /* function */ 

coverage_0x30fda961(0x378b25a7008d80f9b1286336464f99b1172ccfd8fc2e1372f32ba0028c210ad8); /* line */ 
        coverage_0x30fda961(0x02b7930d75fcb6ad14919fe962dcf189e3efd350bb606cab5f0c5a627b70cf8a); /* statement */ 
uint256 numOrders = orderHashes.length;
coverage_0x30fda961(0x25ee6ec80acf750480ea3e17fca9bb8635b112d87e0ebc09dd911dae170cdc84); /* line */ 
        coverage_0x30fda961(0x6e763405bc0a7bb2d99f7804d88cb410f686e11f2ebc8ed3a1ffba67b5e68327); /* statement */ 
OrderQueryOutput[] memory output = new OrderQueryOutput[](numOrders);

        // for each order
coverage_0x30fda961(0xaddea0124f9460e8b297fcdaffaa7427adfd185d927a307fe7a0445aedce68c7); /* line */ 
        coverage_0x30fda961(0xf62eac7df886780079e2b9f9ae12e31ed807dba48712403642b09963b5357fc8); /* statement */ 
for (uint256 i = 0; i < numOrders; i++) {
coverage_0x30fda961(0xb9c05cb864c51a1c183bed6e178f67a08c77bb8d9ca9ba01eb59991fc76f1ac6); /* line */ 
            coverage_0x30fda961(0xddcf0e5aa0f03b0b361e82f633350d8518a2655a7b7e474e77e419f066ece50f); /* statement */ 
bytes32 orderHash = orderHashes[i];
coverage_0x30fda961(0x689c0943ee45a7e4a0ec1a0886ab9491854e3dc5865a963b7157625b01ad03f6); /* line */ 
            coverage_0x30fda961(0xcb251e79ff41688890c2861aa53ba4d3afcada748700caf5cefd762429307551); /* statement */ 
output[i] = OrderQueryOutput({
                orderStatus: g_status[orderHash],
                orderMakerFilledAmount: g_makerFilledAmount[orderHash]
            });
        }
coverage_0x30fda961(0x681f22b2f3fa8c32dcdfb66b46e63f07b021980ae58e0855f31349cff06fcc8e); /* line */ 
        coverage_0x30fda961(0xa166f9d80cfef3735418f4a46b1d1d8bb07bb368bfb952053cf5baaf2f33f7b0); /* statement */ 
return output;
    }

    // ============ Private Storage Functions ============

    /**
     * Cancels an order as long as it is not already canceled.
     */
    function cancelOrderInternal(
        address canceler,
        Order memory order
    )
        private
    {coverage_0x30fda961(0x21d07e5e2c7d84a853811b9e0ca2d36ffb0009656a17d28498df82c4bc80f742); /* function */ 

coverage_0x30fda961(0x4340f76a59393354f657bd4b69d224f2424584a8d83f4b5b4ba56b64d442b118); /* line */ 
        coverage_0x30fda961(0x59e27f97e8372f134d083250fc77b0a353b9d1f7edfe6d9169b6a162f0d4f4c7); /* statement */ 
Require.that(
            canceler == order.makerAccountOwner,
            FILE,
            "Canceler must be maker"
        );
coverage_0x30fda961(0x07067ca0b8e650401181788ca9747a23130261388fdd72eb95af16104310a0d7); /* line */ 
        coverage_0x30fda961(0xe0dd1de21071a59f85979a9ac195562168b872eb533899b9728a8d5cd4c7e232); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0x30fda961(0x65fa825545c696e6f34bb25c4dfbb3cb10b0becca04254ac9f1796d11634df10); /* line */ 
        coverage_0x30fda961(0xe695b41aedffce5e8bee7e628bcf8375404d443bf8f8bb49af1c0eeee41626ff); /* statement */ 
g_status[orderHash] = OrderStatus.Canceled;
coverage_0x30fda961(0xfa6951ecec099dffa13f296ea9a9d86ffd5596c5664e46ea8e8eb73c6c6e3463); /* line */ 
        coverage_0x30fda961(0x6033721eb3245ec8878a057176302a880af76044cc060a994896e6903f43c9b1); /* statement */ 
emit LogStopLimitOrderCanceled(
            orderHash,
            canceler,
            order.makerMarket,
            order.takerMarket
        );
    }

    /**
     * Approves an order as long as it is not already approved or canceled.
     */
    function approveOrderInternal(
        address approver,
        Order memory order
    )
        private
    {coverage_0x30fda961(0x7ce7c1a9cfbf302f7421405bdb392190d9477fbc17bae5670475a2b1c9ab00a2); /* function */ 

coverage_0x30fda961(0x04a1fe1824783e59a05f58b97c9484eabbfe5d0b9c62f0bcdca942090f175060); /* line */ 
        coverage_0x30fda961(0x908bea9014fad4e875eec31c977e33c4e21d6ad96cdd8be3ad11f06c4bfb55ce); /* statement */ 
Require.that(
            approver == order.makerAccountOwner,
            FILE,
            "Approver must be maker"
        );
coverage_0x30fda961(0x1629ad13b009dfd00dec0b954685c221ba16ca31f6abb1a271aca7190bccebf9); /* line */ 
        coverage_0x30fda961(0x8b73bf8594c4e7d89ed2cf6301d54f56f732dc6c566d30e2bc0088faa70d6204); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0x30fda961(0x31330d6484fbc582c12084c742dd671b42774516a877f182cae61fe87be866cd); /* line */ 
        coverage_0x30fda961(0x97313e97b42560fbd29d277a0849e8d35713cce155ae70acff679911260a93ba); /* statement */ 
Require.that(
            g_status[orderHash] != OrderStatus.Canceled,
            FILE,
            "Cannot approve canceled order",
            orderHash
        );
coverage_0x30fda961(0x06cbf3d98e0f84ad5de07ff73d7f86b6837586cc20393326a5ad1861bd399c0d); /* line */ 
        coverage_0x30fda961(0x78f3c82240ef2681f4a1204cda6044a5d062033724fb35a12188c0782a88be39); /* statement */ 
g_status[orderHash] = OrderStatus.Approved;
coverage_0x30fda961(0xd0029e032fcfd33083b9971efdee76ca9fd4a708a3ac0005f350c5fec7691823); /* line */ 
        coverage_0x30fda961(0xb4d93bfb548f284b87ac7b2a00a163a093c66380e2e50f4d1665bd56c97b6b02); /* statement */ 
emit LogStopLimitOrderApproved(
            orderHash,
            approver,
            order.makerMarket,
            order.takerMarket
        );
    }

    // ============ Private Helper Functions ============

    /**
     * Verifies that the order is still fillable for the particular accounts and markets specified.
     */
    function verifyOrderAndAccountsAndMarkets(
        OrderInfo memory orderInfo,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        uint256 inputMarketId,
        uint256 outputMarketId,
        Types.Wei memory inputWei
    )
        private
        view
    {coverage_0x30fda961(0xad608ed30e961827e81a07b8e10769b4d64242ebfeab312d2e0078f035d44804); /* function */ 

        // verify triggerPrice
coverage_0x30fda961(0x002fedec88cfc81c3d612784467e9dcd760dfd7845166ac5121d5e6d53ff52c2); /* line */ 
        coverage_0x30fda961(0xd9097e46c385c03ca74a5f451d3c575042f2d0d68d291be294c0ff19e749c734); /* statement */ 
if (orderInfo.order.triggerPrice > 0) {coverage_0x30fda961(0x9026a4c5f93a1a4c548cbaa8b3acde7f6fdd530acfe1865e2b58f7f5520d7b15); /* branch */ 

coverage_0x30fda961(0xc8274a466d5b4b88c3348a2f754ef42e905fd85f8c6bc49db151aef909f25351); /* line */ 
            coverage_0x30fda961(0x2a75cda55b85de89658ecebf490b96c6a931e6cfb6ee0e8b970822cee476fd6f); /* statement */ 
uint256 currentPrice = getCurrentPrice(
                orderInfo.order.makerMarket,
                orderInfo.order.takerMarket
            );
coverage_0x30fda961(0x94b6390d3bb1ad3af57b913674ed74197850c56b1f21ec9fdb44025252374260); /* line */ 
            coverage_0x30fda961(0x7a005df840d0ba0ae2e16e611ccf93b63ad4dd4e9c4c32cd54ff46ee2166494e); /* statement */ 
Require.that(
                currentPrice >= orderInfo.order.triggerPrice,
                FILE,
                "Order triggerPrice not triggered",
                currentPrice
            );
        }else { coverage_0x30fda961(0x0d233332af991b62ab9cb407b2a8bff6210c7e16f2684b9157221f618313d714); /* branch */ 
}

        // verify expriy
coverage_0x30fda961(0x6515bb9e09df59b0d09b73adf8b54e5c1569b8a01fb11c672ec58d15f43d496c); /* line */ 
        coverage_0x30fda961(0x74b9eee93ffa46cd0d647272080b9c39a94ce84cbe67dd4544f830714093f15d); /* statement */ 
Require.that(
            orderInfo.order.expiration == 0 || orderInfo.order.expiration >= block.timestamp,
            FILE,
            "Order expired",
            orderInfo.orderHash
        );

        // verify maker
coverage_0x30fda961(0x0b444850bff68ac1914b8576d4c0d25c355b3cf1d7ae2f4c26994cee6053cd5f); /* line */ 
        coverage_0x30fda961(0xea2cda3e2ec92a781ea4325ce6b712a43387c856062117d963b19e066ae69cce); /* statement */ 
Require.that(
            makerAccount.owner == orderInfo.order.makerAccountOwner &&
            makerAccount.number == orderInfo.order.makerAccountNumber,
            FILE,
            "Order maker account mismatch",
            orderInfo.orderHash
        );

        // verify taker
coverage_0x30fda961(0xb16e2553c17db8f31618aa6c09eee8fcbba0a7f0b9f3338fda952590147d3e34); /* line */ 
        coverage_0x30fda961(0x2f7280cb15f94008e454f7c431569df666400c41ccd3071ba57cd35a94d30815); /* statement */ 
Require.that(
            (
                orderInfo.order.takerAccountOwner == address(0) &&
                orderInfo.order.takerAccountNumber == 0
            ) || (
                orderInfo.order.takerAccountOwner == takerAccount.owner &&
                orderInfo.order.takerAccountNumber == takerAccount.number
            ),
            FILE,
            "Order taker account mismatch",
            orderInfo.orderHash
        );

        // verify markets
coverage_0x30fda961(0x271512f123271b647826281a44e46eecde4b01bc8a1848b90951ea930f3cdd4e); /* line */ 
        coverage_0x30fda961(0xb0e5d6cce3a2723f47f232d77aea39897a99dae4ae3fecf0f9093a7fa0f710bd); /* statement */ 
Require.that(
            (
                orderInfo.order.makerMarket == outputMarketId &&
                orderInfo.order.takerMarket == inputMarketId
            ) || (
                orderInfo.order.takerMarket == outputMarketId &&
                orderInfo.order.makerMarket == inputMarketId
            ),
            FILE,
            "Market mismatch",
            orderInfo.orderHash
        );

        // verify inputWei
coverage_0x30fda961(0xe81a2a25fcd664811b96a03b52855fdc83ba971340396e1316a80b52802add38); /* line */ 
        coverage_0x30fda961(0xa240bf03652cf2b7594d066c32d9f1630502090b66ac57399f6cf738860a3822); /* statement */ 
Require.that(
            !inputWei.isZero(),
            FILE,
            "InputWei is zero",
            orderInfo.orderHash
        );
coverage_0x30fda961(0x63e81c722234bafb759548afb3ee11169d764c310f83b64f171dabcce43516d5); /* line */ 
        coverage_0x30fda961(0xb6690e945b9f475b0e33ca17518989a27ef0c951ca50d7433a8c6f7a6e39d2db); /* statement */ 
Require.that(
            inputWei.sign == (orderInfo.order.takerMarket == inputMarketId),
            FILE,
            "InputWei sign mismatch",
            orderInfo.orderHash
        );
    }

    /**
     * Verifies that the order is decreasing the size of the maker's position.
     */
    function verifyDecreaseOnly(
        Types.Par memory oldInputPar,
        Types.Par memory newInputPar,
        Types.AssetAmount memory assetAmount,
        Account.Info memory makerAccount,
        uint256 outputMarketId
    )
        private
        view
    {coverage_0x30fda961(0xb82ba5561cf86234d5867c766aa10863d9b7ce5eef72d857f22ae836a443ae56); /* function */ 

        // verify that the balance of inputMarketId is not increased
coverage_0x30fda961(0x7313f70556b031989e4b66491b59d76fcd42febd1a763d65373bd50a408a947c); /* line */ 
        coverage_0x30fda961(0xa1b27baa388e129de9c1a02c8d620ff435370098cc5b16cb51bbbc81f65a950f); /* statement */ 
Require.that(
            newInputPar.isZero()
            || (newInputPar.value <= oldInputPar.value && newInputPar.sign == oldInputPar.sign),
            FILE,
            "inputMarket not decreased"
        );

        // verify that the balance of outputMarketId is not increased
coverage_0x30fda961(0xabd9d7e790bbb62f0552e7e44f0410557287d4aaebf5887ca044900368451bab); /* line */ 
        coverage_0x30fda961(0x1058977691ee2eb7e013573638ea5bf11b01a554c4f6b62f8161c585f56487ab); /* statement */ 
Types.Wei memory oldOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);
coverage_0x30fda961(0x3e9fbd1b611b76cf7485b4af2b688007e4a11fc0659953e3b059588e8d31e8f5); /* line */ 
        coverage_0x30fda961(0xf127f93a34fb3af9cb2191119139a2f63d69ed159ea715cf8a59b50ab044a686); /* statement */ 
Require.that(
            assetAmount.value == 0
            || (assetAmount.value <= oldOutputWei.value && assetAmount.sign != oldOutputWei.sign),
            FILE,
            "outputMarket not decreased"
        );
    }

    /**
     * Returns the AssetAmount for the outputMarketId given the order and the inputs. Updates the
     * filled amount of the order in storage.
     */
    function getOutputAssetAmount(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Types.Wei memory inputWei,
        OrderInfo memory orderInfo
    )
        private
        returns (Types.AssetAmount memory)
    {coverage_0x30fda961(0x98c93985060fc774ef83664a9598c758550dc77b6a3480e0da77e4de97b6d802); /* function */ 

coverage_0x30fda961(0xef87db810099ce12abef46ec326d41eacc4c89b1f5eda747036b4be3cb0be7fa); /* line */ 
        coverage_0x30fda961(0x2088a8ed037d498b3dae0f7a186a6113d2baa940ac84f60e059fb8a359b54756); /* statement */ 
uint256 outputAmount;
coverage_0x30fda961(0xdaf294621cbfd42e62bc442dffa2c4aeb3affbce0ad39ef6db6f1cf64540273f); /* line */ 
        coverage_0x30fda961(0x38350ca1ddae6e6e41746b177920696e323ec139a3f10a2bf2edd9e4aba19d52); /* statement */ 
uint256 makerFillAmount;

coverage_0x30fda961(0x6875dd51302eb38ecf164ce82c4cf5fa9272b499f2a0ec4829ac04cae8ad0d49); /* line */ 
        coverage_0x30fda961(0xe68b9977848e8f7b0c1523a3d5b648bb21a13b391a1af90f2bcf1598ebfc13d2); /* statement */ 
if (orderInfo.order.takerMarket == inputMarketId) {coverage_0x30fda961(0x0031a404fd20c0867863b4fbbeacb3baa8be97da7307eaad34dbd94c5156a70f); /* branch */ 

coverage_0x30fda961(0x4f482319b535894c84d86a51316b184ca48d049231331ed0292be9a7a2a7eaea); /* line */ 
            coverage_0x30fda961(0x39d94aab9b2028d3ba8b08af3064ccad6745a7672aedbb7d0847a5838dec8a8d); /* statement */ 
outputAmount = inputWei.value.getPartial(
                orderInfo.order.makerAmount,
                orderInfo.order.takerAmount
            );
coverage_0x30fda961(0xce3ebec4e937a33abe67a5d1661e9f481bb518a9a185d08dc033465073c5a217); /* line */ 
            coverage_0x30fda961(0x1c41ddd792cd04df46c3cf49be4847a742db3bd406b1a382fe3c80211cd66bf5); /* statement */ 
makerFillAmount = outputAmount;
        } else {coverage_0x30fda961(0x401f0fe5e5a6b9e283adea77cc3d116299732c02d48e6903bf5307af7091634e); /* branch */ 

coverage_0x30fda961(0xc5d2f8f6e1619952aa30281359f0c581ca6441c4151178ae6c6031cc7e8d872d); /* line */ 
            coverage_0x30fda961(0xce197de6233dd5b7fd3e41eb6806d5b0748872367e98e457abe49cbadf66b87a); /* assertPre */ 
coverage_0x30fda961(0xea04e7beda8c25addce40807bdf41d0bd5a1114d1cfc8e6b83fdcc6ac60e5ea4); /* statement */ 
assert(orderInfo.order.takerMarket == outputMarketId);coverage_0x30fda961(0xfd6116417d746afe34c6e6f973cb279e4ba693b4572ed09f1b894a7daf904c81); /* assertPost */ 

coverage_0x30fda961(0x9f71c1b8609c17f08917e47223d53c075f543dbf1c998f4189cc1c99e8126d09); /* line */ 
            coverage_0x30fda961(0xe06a6401c7d08d08fa54bf2cb8007c0a111143146c14b78c9312df6acbbfa464); /* statement */ 
outputAmount = inputWei.value.getPartialRoundUp(
                orderInfo.order.takerAmount,
                orderInfo.order.makerAmount
            );
coverage_0x30fda961(0xdfdbe28e47976e2969e732e13aaa5515fc617a233861502ac1bdb2ca3a346ecb); /* line */ 
            coverage_0x30fda961(0x05c60c23d9241b93d624e5132e26561612dad6369b088d676a72cfa3072e842c); /* statement */ 
makerFillAmount = inputWei.value;
        }

coverage_0x30fda961(0x397778bcf2852e47b5b981e95a1c5af514ec1552d3bbd9aa89d7ffa249cf3806); /* line */ 
        coverage_0x30fda961(0x809a66e39ddf99c1b16698c5073237bd7430416b6a02268d70d19a4ab455e4b1); /* statement */ 
updateMakerFilledAmount(orderInfo, makerFillAmount);

coverage_0x30fda961(0x3098abed34c7d82326038565af238fa85d344839b08af185871fe6cac4507883); /* line */ 
        coverage_0x30fda961(0xbf822788ab755f2094eb4d492baeb38ba3c9b0322442553eae661512d5a51b43); /* statement */ 
return Types.AssetAmount({
            sign: orderInfo.order.takerMarket == outputMarketId,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: outputAmount
        });
    }

    /**
     * Increases the stored filled amount (in makerAmount) of the order by makerFillAmount.
     * Returns the new total filled amount (in makerAmount).
     */
    function updateMakerFilledAmount(
        OrderInfo memory orderInfo,
        uint256 makerFillAmount
    )
        private
    {coverage_0x30fda961(0x5b90bbb69c331da603bbb3085dd1b3c4625ec71385b1a931422188c5ca7d1692); /* function */ 

coverage_0x30fda961(0x5e89db082b1fc115d73fab1cd20d4008c88fc5c60b281d09a9f5c47969fd4cfa); /* line */ 
        coverage_0x30fda961(0xa3f0f3f52c2ec09e18c8e33ab31b4fac19f6cf6dbdcc6b114ba32753bb0028bf); /* statement */ 
uint256 oldMakerFilledAmount = g_makerFilledAmount[orderInfo.orderHash];
coverage_0x30fda961(0xf37617b7d8b933cdd464f71c841fce33f7e3c91b630f282cf3dc79a81581ea6b); /* line */ 
        coverage_0x30fda961(0x37b57ab3c608c4119fda6fea109729af60726037912895b417adc0e1a2e51ff3); /* statement */ 
uint256 totalMakerFilledAmount = oldMakerFilledAmount.add(makerFillAmount);
coverage_0x30fda961(0xcf69705f5cbefd9c49bdb1c11e285c485d07266e6907c39b44f33947f7e1ff92); /* line */ 
        coverage_0x30fda961(0xa2ee6f6341c301dfc5ff580132883a5ccd836d18581ca8cace7bfd4172803169); /* statement */ 
Require.that(
            totalMakerFilledAmount <= orderInfo.order.makerAmount,
            FILE,
            "Cannot overfill order",
            orderInfo.orderHash,
            oldMakerFilledAmount,
            makerFillAmount
        );

coverage_0x30fda961(0xcc732bdc98e9e90ecb59e181e3e1e1dbc5800969c8556fa8a034f502db793d76); /* line */ 
        coverage_0x30fda961(0xcdd193196ac0626cf0e8a71a90f70e03f4ba97a472285d0d52be951dc56aa94e); /* statement */ 
g_makerFilledAmount[orderInfo.orderHash] = totalMakerFilledAmount;

coverage_0x30fda961(0xe757621af546b7cd72667b5ed9460f4cd67971af18a2d3111bd1db7f2845ed8d); /* line */ 
        coverage_0x30fda961(0xd1ba91cd09e82933f5acbac733e1377f7741abfa0f3bce6134f363a0e7c4411a); /* statement */ 
emit LogStopLimitOrderFilled(
            orderInfo.orderHash,
            orderInfo.order.makerAccountOwner,
            makerFillAmount,
            totalMakerFilledAmount
        );
    }

    /**
     * Returns the current price of makerMarket divided by the current price of takerMarket. This
     * value is multiplied by 10^18.
     */
    function getCurrentPrice(
        uint256 makerMarket,
        uint256 takerMarket
    )
        private
        view
        returns (uint256)
    {coverage_0x30fda961(0x99f709864b062d8e74747e9486fb3660acec9e4f7110f864c6931653f6aaaaaf); /* function */ 

coverage_0x30fda961(0xd4371e4c23a153ae6d10e098d6a82e0968dc1863e3e8fd2adabba705686699a7); /* line */ 
        coverage_0x30fda961(0xa7eb170bcea636c05b2dba5c10dc6809cb5162493e10a3c84bf779e86d590cf2); /* statement */ 
Monetary.Price memory takerPrice = SOLO_MARGIN.getMarketPrice(takerMarket);
coverage_0x30fda961(0xecb76405a8bb94a91977d5325ac5d2e26023c7a75e6229f14abef7663c10ecdc); /* line */ 
        coverage_0x30fda961(0xc4875534b62da2b033eae6660878693e54e1e3ca0963a753c6b91057648abf6e); /* statement */ 
Monetary.Price memory makerPrice = SOLO_MARGIN.getMarketPrice(makerMarket);
coverage_0x30fda961(0x33b5fdf9029be6f1f5b21fe34f5aef1ca7d3bd2637d6df9133913e1e9e5137e6); /* line */ 
        coverage_0x30fda961(0x8075ef2eb16b298940c9d43d0f4956878dc8cd4144801ca54d5fa706913f0b39); /* statement */ 
return takerPrice.value.mul(PRICE_BASE).div(makerPrice.value);
    }

    /**
     * Parses the order, verifies that it is not expired or canceled, and verifies the signature.
     */
    function getOrderAndValidateSignature(
        bytes memory data
    )
        private
        view
        returns (OrderInfo memory)
    {coverage_0x30fda961(0x290a3cdcdc1c182c97f609144096fbd5a2ac3cfebf9c99abecb1bbf4fe9cb993); /* function */ 

coverage_0x30fda961(0xca4c1309817494d02bbd67f93def119bcf2e733c0ef498efe9590de61ac06860); /* line */ 
        coverage_0x30fda961(0xfe2a0d9497415df13fc38a89db312b73c59ca43fbd19317167f1f76a753d3b8a); /* statement */ 
Require.that(
            (
                data.length == NUM_ORDER_BYTES ||
                data.length == NUM_ORDER_BYTES + NUM_SIGNATURE_BYTES
            ),
            FILE,
            "Cannot parse order from data"
        );

coverage_0x30fda961(0x7b8b24374d6a5ad178e73a55bcc1cdf27ce143d6d36898e81fd7ded1276a464e); /* line */ 
        coverage_0x30fda961(0x08dd6d580a9455c61fe445a16359d32c3906a58cfac1099e7513152ab1ee5db9); /* statement */ 
OrderInfo memory orderInfo;
coverage_0x30fda961(0x7bf664fd14776274e5044acf2e5ba0c0d8f411d192154d94d9b855e4dde3de92); /* line */ 
        coverage_0x30fda961(0xcc5c0e0282795135205df2535050f0feea711d06bffe89b6f879c86c5ec78603); /* statement */ 
orderInfo.order = abi.decode(data, (Order));
coverage_0x30fda961(0x4902ec794b68969f44afebb9516e665abbc9ecead5eb9783e122fc48df824379); /* line */ 
        coverage_0x30fda961(0x9e3bae4c2b2817eb8a0fba9cf447bfcd87480c9c91af99998cda8f036778f503); /* statement */ 
orderInfo.orderHash = getOrderHash(orderInfo.order);

coverage_0x30fda961(0xe43a27c110272367b573a059f3cd42ca0f033857f9d67407911676e0fa3b11db); /* line */ 
        coverage_0x30fda961(0x415fbdb6a5d0a61f1e8db75967107eed56ef37ef0adbf2f4b44eefdd4458a13b); /* statement */ 
OrderStatus orderStatus = g_status[orderInfo.orderHash];

        // verify valid signature or is pre-approved
coverage_0x30fda961(0x2abe59348cd21b5898829116e424e1e3a1b84520cc99d05ee9e031e62b9fd5ae); /* line */ 
        coverage_0x30fda961(0xad03af1f7b15533c3092ee9f6e102f9cedda04f6a413980cc9d2c1cd036c655e); /* statement */ 
if (orderStatus == OrderStatus.Null) {coverage_0x30fda961(0x6a3c4e96c72063859d248bc09b05325d74385ba219972d914397c716d5fd2b1f); /* branch */ 

coverage_0x30fda961(0xe8703718e8debaa6c90955dfdc3a61376c94b0413904e7c9a10054677f286942); /* line */ 
            coverage_0x30fda961(0x7da305eeebc6dbf53a919b995bdae6dc8eaa17389e8b38e732bb2d51603de7bf); /* statement */ 
bytes memory signature = parseSignature(data);
coverage_0x30fda961(0xa00eb0320d89a3a14301227f4e1806c96866202e64289f0afdb2e7cd30ad7a1d); /* line */ 
            coverage_0x30fda961(0xfa3cca3e8d901fd29f3a683f89354caca496a358e69fe16f1745a36d9affee10); /* statement */ 
address signer = TypedSignature.recover(orderInfo.orderHash, signature);
coverage_0x30fda961(0x29f725d18e8f7e5641c72de96eda09bcb4efef51957c5cec2c1602157e91522a); /* line */ 
            coverage_0x30fda961(0x60f58bfc549b1be63415648d0344c98c34568b850069ef6e0bbda74a8697e6d0); /* statement */ 
Require.that(
                orderInfo.order.makerAccountOwner == signer,
                FILE,
                "Order invalid signature",
                orderInfo.orderHash
            );
        } else {coverage_0x30fda961(0x55adee93e8c7a523c00c5efe0e26b06eae4e371dedf13191cd111ce53e997141); /* branch */ 

coverage_0x30fda961(0xd8a98086c6b0cdc6691138a3742a147823c213c8f33c6d9701f9e04eb62c6d44); /* line */ 
            coverage_0x30fda961(0x27da33b78fe5dda3fd7bac96f5c7af41e00e4df4d4f8ed7b87f1a1a03d339822); /* statement */ 
Require.that(
                orderStatus != OrderStatus.Canceled,
                FILE,
                "Order canceled",
                orderInfo.orderHash
            );
coverage_0x30fda961(0xccc4472355ac67cd98d63e5c77c6d6eb7237093819916774eb00518d77618003); /* line */ 
            coverage_0x30fda961(0xa8545921c370a863f33a2d4a7923b2e7ab616f30931fe1e9823d72f0ce3c72fc); /* assertPre */ 
coverage_0x30fda961(0x4e4a69281c2d6523e333d04eb5c85923ea0a2705c9c5b165bee1076aba1b7197); /* statement */ 
assert(orderStatus == OrderStatus.Approved);coverage_0x30fda961(0x07ac8d6878c794ed76c79e3178c8b8c371b974f7e2f0273a590df04a81d0cf15); /* assertPost */ 

        }

coverage_0x30fda961(0xb86261367db5db96499df6cdd0b033e6ffd10197c7277a9b64834f90dccee38a); /* line */ 
        coverage_0x30fda961(0x7877a67c319e97196ed19910912ede58555ddbd81dfb6270aff10ad89871f946); /* statement */ 
return orderInfo;
    }

    // ============ Private Parsing Functions ============

    /**
     * Returns the EIP712 hash of an order.
     */
    function getOrderHash(
        Order memory order
    )
        private
        view
        returns (bytes32)
    {coverage_0x30fda961(0x1535cea24ec86374a5528c781f7480fb3cdc81c596faa4de9f71c5e3df1b2fed); /* function */ 

        // compute the overall signed struct hash
        /* solium-disable-next-line indentation */
coverage_0x30fda961(0xdca07e1dcee1ca5fb2f78537cceabd6617fb3c971e605500be27e6ca48cceffd); /* line */ 
        coverage_0x30fda961(0xb6d5192f6ea53b4579d100427eda3d2375195eec04c7b2d5888e1651b7ba299f); /* statement */ 
bytes32 structHash = keccak256(abi.encode(
            EIP712_ORDER_STRUCT_SCHEMA_HASH,
            order
        ));

        // compute eip712 compliant hash
        /* solium-disable-next-line indentation */
coverage_0x30fda961(0x7116c48d11b39d7d2aa5354234fb3c018911fea992b08c5b892889b442bc9d3f); /* line */ 
        coverage_0x30fda961(0xc76ad81b6623f8b8cb0f1f35b29bc19461e0225515c1ed58c4f5989451d83430); /* statement */ 
return keccak256(abi.encodePacked(
            EIP191_HEADER,
            EIP712_DOMAIN_HASH,
            structHash
        ));
    }

    /**
     * Parses out a signature from call data.
     */
    function parseSignature(
        bytes memory data
    )
        private
        pure
        returns (bytes memory)
    {coverage_0x30fda961(0x7e6838204a7dbfeda7a3ad3582cea493a27f81843089c58c2ce548059088ccad); /* function */ 

coverage_0x30fda961(0x4d71ecf904f02ba472a7df4c6e5630236facd2efcb7dbc7e2d9a22f3f861efa3); /* line */ 
        coverage_0x30fda961(0x093212711ff387fd6a4ea91eac49cfa640cb453bc4a5fdf5de96adba06472ae8); /* statement */ 
Require.that(
            data.length == NUM_ORDER_BYTES + NUM_SIGNATURE_BYTES,
            FILE,
            "Cannot parse signature from data"
        );

coverage_0x30fda961(0xace3b42650bc4bdb05642ba4192ae99cb11374a200b30c9ab8788685a73e2d08); /* line */ 
        coverage_0x30fda961(0x1d23b332faf4e70ef1a6af67282f3e830099316020e7c8d846224290b48366c2); /* statement */ 
bytes memory signature = new bytes(NUM_SIGNATURE_BYTES);

coverage_0x30fda961(0x26edfd70a113a8645b8782ae69e423914b44ea306485ab0e126ca82e299c96b3); /* line */ 
        coverage_0x30fda961(0x27ef48937e452beba0e5885eede3d2614a9f05174de98915b6d35123291f6ab6); /* statement */ 
uint256 sigOffset = NUM_ORDER_BYTES;
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x30fda961(0x9a9f4e02f749f92b561a08ba4ab37debc4fbe165f0943f943fa4d2eaf5da043c); /* line */ 
        assembly {
            let sigStart := add(data, sigOffset)
            mstore(add(signature, 0x020), mload(add(sigStart, 0x20)))
            mstore(add(signature, 0x040), mload(add(sigStart, 0x40)))
            mstore(add(signature, 0x042), mload(add(sigStart, 0x42)))
        }

coverage_0x30fda961(0xf548226beac93607b50b357f536276c5e964e93cbc51812d588a1cdfaac86752); /* line */ 
        coverage_0x30fda961(0x9094e1ec3a6279ad5cf0ce58877238515b061b67f6a5453ebd71dbb953ff4b32); /* statement */ 
return signature;
    }
}
