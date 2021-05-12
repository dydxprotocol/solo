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
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";
import { OnlySolo } from "../helpers/OnlySolo.sol";
import { TypedSignature } from "../lib/TypedSignature.sol";


/**
 * @title LimitOrders
 * @author dYdX
 *
 * Allows for Limit Orders to be used with dYdX
 */
contract LimitOrders is
    Ownable,
    OnlySolo,
    IAutoTrader,
    ICallee
{
function coverage_0xe692fa88(bytes32 c__0xe692fa88) public pure {}

    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant private FILE = "LimitOrders";

    // EIP191 header for EIP712 prefix
    bytes2 constant private EIP191_HEADER = 0x1901;

    // EIP712 Domain Name value
    string constant private EIP712_DOMAIN_NAME = "LimitOrders";

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

    // Hash of the EIP712 LimitOrder struct
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_LIMIT_ORDER_STRUCT_SCHEMA_HASH = keccak256(abi.encodePacked(
        "LimitOrder(",
        "uint256 makerMarket,",
        "uint256 takerMarket,",
        "uint256 makerAmount,",
        "uint256 takerAmount,",
        "address makerAccountOwner,",
        "uint256 makerAccountNumber,",
        "address takerAccountOwner,",
        "uint256 takerAccountNumber,",
        "uint256 expiration,",
        "uint256 salt",
        ")"
    ));

    // Number of bytes in an Order struct
    uint256 constant private NUM_ORDER_BYTES = 320;

    // Number of bytes in a typed signature
    uint256 constant private NUM_SIGNATURE_BYTES = 66;

    // Number of bytes in a CallFunctionData struct
    uint256 constant private NUM_CALLFUNCTIONDATA_BYTES = 32 + NUM_ORDER_BYTES;

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

    event LogLimitOrderCanceled(
        bytes32 indexed orderHash,
        address indexed canceler,
        uint256 makerMarket,
        uint256 takerMarket
    );

    event LogLimitOrderApproved(
        bytes32 indexed orderHash,
        address indexed approver,
        uint256 makerMarket,
        uint256 takerMarket
    );

    event LogLimitOrderFilled(
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
    {coverage_0xe692fa88(0x9c6d66694894be83b46bba1fc2fa217e177149c2775ff4fc8aca35f2805796f2); /* function */ 

coverage_0xe692fa88(0x4fa393bf6df47ec73ffd25430a730dbeb29bafa260a6660538b471c3f73251c3); /* line */ 
        coverage_0xe692fa88(0x97eefee826a7e37b9f6b92c287626776cba76b56907fe4b557af58e09d3a2423); /* statement */ 
g_isOperational = true;

        /* solium-disable-next-line indentation */
coverage_0xe692fa88(0x3427ff17d6db33d8f906e511c0200dc50d231cf377a3c466b4ad18e93bc0c7ab); /* line */ 
        coverage_0xe692fa88(0x91b62f8bebe9d4f924a04945d74fb5709157f69c8215ea0fb17b972811426ebc); /* statement */ 
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
    {coverage_0xe692fa88(0x5add735f3f676ce7b1adfadb08631d6210e5d0e0333c3172f66de65ebbdb4c48); /* function */ 

coverage_0xe692fa88(0x1176088f18b7bfaf91d477c00efddda56104ffc18dc20f6bdf80ea5ff3f6e1d3); /* line */ 
        coverage_0xe692fa88(0xf5ddbb33a5f7703cb2abd4c73ef53aca44307bfd2d6823d62849e315619b58fe); /* statement */ 
g_isOperational = false;
coverage_0xe692fa88(0x5731f2ebdb206f3dbeb6937e78ac2dafec925357a87ea85f763c08325c46cb8d); /* line */ 
        coverage_0xe692fa88(0x989c8a2cd3514a46a4c0c97d63c81eb88584efc5aada7a294f4530ebbcedd599); /* statement */ 
emit ContractStatusSet(false);
    }

    /**
     * The owner can start back up the exchange.
     */
    function startUp()
        external
        onlyOwner
    {coverage_0xe692fa88(0x0ad74f9d012bc97a0260c05b7ddec1ccfe0880b2f130733e17eef64ea6c8a28f); /* function */ 

coverage_0xe692fa88(0x43527d16b4b7d10d40d22c2f15bc804a9f626afc70cfca7d10873955f2e31498); /* line */ 
        coverage_0xe692fa88(0xa6547707823dcc60a1e8ce117f2265355243bef13e295c08b539ce101a1b4002); /* statement */ 
g_isOperational = true;
coverage_0xe692fa88(0x9c38773fbf546c1a9cdb515e46950762ec03aa9698cd0b2d2628ea89cbfcde23); /* line */ 
        coverage_0xe692fa88(0x6eee84876cb52df7b1af371d662d61099932a238dca75334dfd40887d2b45605); /* statement */ 
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
    {coverage_0xe692fa88(0xdd0dd477355b62264389436fdd90014732883bec100a31a2ad7a9fb608f8654a); /* function */ 

coverage_0xe692fa88(0x59dcb7f6ade0b76617030fa5f122d82512f3eaaf9b95568b26a92b35d205350a); /* line */ 
        coverage_0xe692fa88(0xfee0e482930e4d7251e86938cc2f7381aa1375e6fff5988d75a6253f2a8ec432); /* statement */ 
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
    {coverage_0xe692fa88(0x2b6a77c60ac3c4110df43f504612712e0871a32c5d8c068d902b9a022ff3bb3e); /* function */ 

coverage_0xe692fa88(0x206a391ea69be8f2de1c2915b5ad621ff7071b71b59ceb2f43011621b5b46a98); /* line */ 
        coverage_0xe692fa88(0x0f3b6f0a7508aa84a386c72a670a47a30fb09e7e23f9d9d54dec2dc0a4122573); /* statement */ 
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
     *  param  oldInputPar     (unused)
     *  param  newInputPar     (unused)
     * @param  inputWei        The change in token amount for the makerAccount for the inputMarketId
     * @param  data            Arbitrary data passed in by the trader
     * @return                 The AssetAmount for the makerAccount for the outputMarketId
     */
    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory /* oldInputPar */,
        Types.Par memory /* newInputPar */,
        Types.Wei memory inputWei,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
        returns (Types.AssetAmount memory)
    {coverage_0xe692fa88(0xb95b131d419eaa4fa9c60a88b2a0265e7299f442b439522536484c5fc1263270); /* function */ 

coverage_0xe692fa88(0x9a746396338df785bcbeb361f57846192158b21a3d06a3bc10a894b78ce7bda5); /* line */ 
        coverage_0xe692fa88(0x13900a549ccd348fc9e05450a2eb6fe19518b3c81390d6a37b53e18087a2dc66); /* statement */ 
Require.that(
            g_isOperational,
            FILE,
            "Contract is not operational"
        );

coverage_0xe692fa88(0x04c815e3d7e26c8f9ff74bb88231e964d96dbadf6c6a03b78e5f0a206ea0b5c2); /* line */ 
        coverage_0xe692fa88(0x2b337c3e17fd6568e8d26ddcf6557d15498969bbcfb62e828c5c84498eb1d316); /* statement */ 
OrderInfo memory orderInfo = getOrderAndValidateSignature(data);

coverage_0xe692fa88(0xe04931c58f21424f9159d316d6fb0599b0387861231240ce18446de5a2c287c1); /* line */ 
        coverage_0xe692fa88(0x6afcf42c422a5865e6e99ab35830bbc1a89f4005b14f851bd4502d2d7b54cd8c); /* statement */ 
verifyOrderAndAccountsAndMarkets(
            orderInfo,
            makerAccount,
            takerAccount,
            inputMarketId,
            outputMarketId,
            inputWei
        );

coverage_0xe692fa88(0x4a7d470ca38c7ac58ef89147d3baf45cca9f7e569b9e8de59cebefcc7cbb63c7); /* line */ 
        coverage_0xe692fa88(0x655af7453e59d10e68158351111e22da3bda5f09680318cdaffe2c532cd47d15); /* statement */ 
return getOutputAssetAmount(
            inputMarketId,
            outputMarketId,
            inputWei,
            orderInfo
        );
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
    {coverage_0xe692fa88(0xb08162a31ae4d4efd934dc8d76cd58b986b32ec4f50cbe1c7b0a4ad807ec964e); /* function */ 

coverage_0xe692fa88(0x49ac49c94ac3fcaa0628225b63eaf43080865c513e0a3394edf35b4d3fc55d4a); /* line */ 
        coverage_0xe692fa88(0x35eb65bbddaf480a15ff5291afa9f1a3f644119df4db88411245f8d7ef6db9be); /* statement */ 
Require.that(
            data.length == NUM_CALLFUNCTIONDATA_BYTES,
            FILE,
            "Cannot parse CallFunctionData"
        );

coverage_0xe692fa88(0xb3216a15ee22d828ada528fb41aaf01bdee7aa5f9f2bdc1188c2f5236a2aa10a); /* line */ 
        coverage_0xe692fa88(0x259298e2ad915560e8a176e570098ebb03f3499c67a35e562fb35439cc8a8d18); /* statement */ 
CallFunctionData memory cfd = abi.decode(data, (CallFunctionData));

coverage_0xe692fa88(0x043852ed403753ba5ce085b1fa8be1e2e366a18ec45fb42935f572cd3da289f3); /* line */ 
        coverage_0xe692fa88(0xd3eff6bb50327097e961315792f6bbf0790020433a6a60a4c9ffc8309d9b98e7); /* statement */ 
if (cfd.callType == CallFunctionType.Approve) {coverage_0xe692fa88(0xb0df00891f7ee82607b747fe178b3c570a75c6df27df0d7ffb4f379052ca2c36); /* branch */ 

coverage_0xe692fa88(0xe280a93b993e6f63d721b01bd28d29de742c1150b229bbc2bd44ace85cb9935f); /* line */ 
            coverage_0xe692fa88(0x93a44d2734fe9542608cde3705ec44111c875ca459a5dfc761b148098cc8fcf5); /* statement */ 
approveOrderInternal(accountInfo.owner, cfd.order);
        } else {coverage_0xe692fa88(0xc93a30bcda3002f6a43ed6e012d2ccbb6d15d64be37e28ca5eae62003fbb15b8); /* branch */ 

coverage_0xe692fa88(0x07a515aef92559e85d1d235d81e599e3015ec02ccb0e692d31dce314a25ec9ae); /* line */ 
            coverage_0xe692fa88(0xe7ab0346788f36c1c7a3e16858e6f628dcfbf657053d73f36538e18a75a06b27); /* assertPre */ 
coverage_0xe692fa88(0xb9bf39c83260e52604d18b7432bf3f4630d13e64233fd88d4c80c8abc83155d3); /* statement */ 
assert(cfd.callType == CallFunctionType.Cancel);coverage_0xe692fa88(0x5f9ddd27dc46e7134eb2ceb8ade994e52424bbff5c3628b324a8da0a729bf39b); /* assertPost */ 

coverage_0xe692fa88(0x3072d39a7f941dbc2d90365aeb52ae6f533065006b0fe18d6e8a307f4c33d140); /* line */ 
            coverage_0xe692fa88(0x6c0b2da660df95975835f7535050a048ec951975bcbb15de597239ac20e77174); /* statement */ 
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
    {coverage_0xe692fa88(0x0db1341cf6abcdbecf3334dcccc2102e40d09e7a8f554fc20e652a700eeb3215); /* function */ 

coverage_0xe692fa88(0xe7905e241af0afeb2e9c0e4cd59d12f5453b0d9f0efe8eadd3adae6228e5a7ca); /* line */ 
        coverage_0xe692fa88(0xbd35b89cb42127f25c2073703be0807bcd54d605981d53592cf6004073b1ef3e); /* statement */ 
uint256 numOrders = orderHashes.length;
coverage_0xe692fa88(0xbd938e4e471e325aa65ab971a805eaf91ce04be1901cbe6d66a6d23287bf733b); /* line */ 
        coverage_0xe692fa88(0x11b9c550ff871afc750f2459dc3fa993100912278fef77772d27061a2b07fde1); /* statement */ 
OrderQueryOutput[] memory output = new OrderQueryOutput[](numOrders);

        // for each order
coverage_0xe692fa88(0x616b1144d969889f2afdfd059b5b470eb58397a20795bd477175e7e1c9a89382); /* line */ 
        coverage_0xe692fa88(0x21bc7df8f91d3ef1421debc2fd6cb3dc873f743aaa459624768d36e4318cd289); /* statement */ 
for (uint256 i = 0; i < numOrders; i++) {
coverage_0xe692fa88(0xf302f698eda295cea7d0f5fed0747f17f899e234dcb82274f3f635e752c88097); /* line */ 
            coverage_0xe692fa88(0xa1235289575a08238ddffb5e9a5a5349a87c06ff49a4d3ebc201e0abe1df6af6); /* statement */ 
bytes32 orderHash = orderHashes[i];
coverage_0xe692fa88(0x8b3f08befdb3efe4bfbce8c8ccdc84d456a203e0ea142e185961a56ec1a80b31); /* line */ 
            coverage_0xe692fa88(0x19231ee6959b288e0995b2cfc0fd74cbbe56bb3e66f5512a814779c3ae315c8d); /* statement */ 
output[i] = OrderQueryOutput({
                orderStatus: g_status[orderHash],
                orderMakerFilledAmount: g_makerFilledAmount[orderHash]
            });
        }
coverage_0xe692fa88(0x6763f5779088f9671c2707541e702c746e770ecd689492c74f4770d5c179e130); /* line */ 
        coverage_0xe692fa88(0x4bf4fdbf60570ebf23bfa05672739445fbd0969bcd6936766989958be4d07f5c); /* statement */ 
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
    {coverage_0xe692fa88(0xa43681c579c3e34b74abbf0792c1696e0c56f618bc87f78b72cf072cfc95eb58); /* function */ 

coverage_0xe692fa88(0xef16f07676f01aeea134b7425512f16093450e6939250e188253a7ff1509e468); /* line */ 
        coverage_0xe692fa88(0xec277951f1d3775eafe9294d584c3e772f87e476b0484aafb86866fca1a90a43); /* statement */ 
Require.that(
            canceler == order.makerAccountOwner,
            FILE,
            "Canceler must be maker"
        );
coverage_0xe692fa88(0xe361d25a46ace97ae71d88c4c188eb2cdfc9f830a5b5dc92477a72ea847a959e); /* line */ 
        coverage_0xe692fa88(0x8572dd32ff5a470fcb33bf4b524f953b84766747fb8096a8c30fe0719cb78b8d); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0xe692fa88(0x273963e5ca2f81cf713bb262d0bbcb2de3a1c4cc25c6fb2ffb4bdd8ff7dd6544); /* line */ 
        coverage_0xe692fa88(0x53c8e5c82f0bfd41ebf117b3c881cdbcd04f29a8b2ba368df04dd1f597a12fa8); /* statement */ 
g_status[orderHash] = OrderStatus.Canceled;
coverage_0xe692fa88(0xf7656896dff8851207f81bd194491721265e6086a56f8605356c85399ea61265); /* line */ 
        coverage_0xe692fa88(0x7d573ae944804faa7037eafdb1847e3991ae3bd304521e1e789b892e2ff8ce81); /* statement */ 
emit LogLimitOrderCanceled(
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
    {coverage_0xe692fa88(0x7b326cc5bb4dcf02aa9eb429c6e0663a7e3c70e8cb3e7b2e04aaa94f33701aa9); /* function */ 

coverage_0xe692fa88(0x048420394a08310f2f5e83500c64870dbc199839da89b3191720892d86d01cff); /* line */ 
        coverage_0xe692fa88(0xa047c57677348837df076ef039272aa3e562875f5adf786f12757a526add5a16); /* statement */ 
Require.that(
            approver == order.makerAccountOwner,
            FILE,
            "Approver must be maker"
        );
coverage_0xe692fa88(0x1284aadc0051cef4786d54a7f5ab37eaf11ef4aacff560934409b8ea077536be); /* line */ 
        coverage_0xe692fa88(0x74cf485a6e8ecefa3536829c78f517e6fcc8d4bbb08984dd5539489ae5ef0785); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0xe692fa88(0x1e3d637cce0268e75c35571dd80195d55c4cd48b7fe20de4ac9bc72ec1532771); /* line */ 
        coverage_0xe692fa88(0x25c506ad4743408f393f59ab7b78a9d310a81f717931eac88d7aa467d99f2172); /* statement */ 
Require.that(
            g_status[orderHash] != OrderStatus.Canceled,
            FILE,
            "Cannot approve canceled order",
            orderHash
        );
coverage_0xe692fa88(0x03a87e707fa03d6792a37254c57f457651151c51ffc3abf70206204e4f66c0e4); /* line */ 
        coverage_0xe692fa88(0x083fc053855b3c6d29bfa8805d60ef2ff51be2a9b18d58f5c3c0ff5f9fc27bab); /* statement */ 
g_status[orderHash] = OrderStatus.Approved;
coverage_0xe692fa88(0x9c57e1314cd01095a4bc8b0e723b9dfc693443d3fcdab789ca66d215af5a5138); /* line */ 
        coverage_0xe692fa88(0x2481ee5a9348979bb18073f55f87dadff14fa2b38404b2f9a49bfec4bd8363ac); /* statement */ 
emit LogLimitOrderApproved(
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
    {coverage_0xe692fa88(0x92024145d2315e69e881343e25d509cd82c0da8410da267174fe42bcd45d5800); /* function */ 

        // verify expriy
coverage_0xe692fa88(0x45729fd6b0149064ab9cb25d16d4905fbba3eb9d25b983d1c64ab324f3f301b8); /* line */ 
        coverage_0xe692fa88(0xa6562c07ec5349c5d3b23bfaf7f15b2c2968e9f70307a4ee0b3e03597597f64b); /* statement */ 
Require.that(
            orderInfo.order.expiration == 0 || orderInfo.order.expiration >= block.timestamp,
            FILE,
            "Order expired",
            orderInfo.orderHash
        );

        // verify maker
coverage_0xe692fa88(0x62e12ea4282b1265102258870f3f0d5a0eb120d490ec0213525c6bc595209f33); /* line */ 
        coverage_0xe692fa88(0x2f34f26f02fa09d4338aad6e643730fe010a34cf951fd8544f19def138250625); /* statement */ 
Require.that(
            makerAccount.owner == orderInfo.order.makerAccountOwner &&
            makerAccount.number == orderInfo.order.makerAccountNumber,
            FILE,
            "Order maker account mismatch",
            orderInfo.orderHash
        );

        // verify taker
coverage_0xe692fa88(0x973f9098cbbbebff4517540c63f5c0f15b8bae44242c1c6cdc5528bb157c7215); /* line */ 
        coverage_0xe692fa88(0x58182d3bbbff49f25a200925e6b31d7fcfa6e5198c470d301d77f0411904ae98); /* statement */ 
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
coverage_0xe692fa88(0x45e9c2f85d99ed91ffad62812e05d664ae20d723ace6dd7764a78adcaf2b1e15); /* line */ 
        coverage_0xe692fa88(0xec49392ef823809bad17e65660180f8eaac4d7cdef7def29c717a0a169f873a3); /* statement */ 
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
coverage_0xe692fa88(0x8e278cc191bdb6eaed20b3ff00960cfab92340c7c4bf4ca4ed8cb7fe0f7dd017); /* line */ 
        coverage_0xe692fa88(0xf1e3982eb37b32b0dea35c8b752ff27eda7bdc0137df55b9746dfa14f8efa4f2); /* statement */ 
Require.that(
            !inputWei.isZero(),
            FILE,
            "InputWei is zero",
            orderInfo.orderHash
        );
coverage_0xe692fa88(0x04a2fb61b88e5637987ffe9c7f7cfd1ecd810a1adb9c8ada1059f5c17c7e083a); /* line */ 
        coverage_0xe692fa88(0xa109b8c83bec5b0b6a8747f6cb9fae8263174ca0f389e1f3b03fe1e2c976b6dd); /* statement */ 
Require.that(
            inputWei.sign == (orderInfo.order.takerMarket == inputMarketId),
            FILE,
            "InputWei sign mismatch",
            orderInfo.orderHash
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
    {coverage_0xe692fa88(0xf7478af2129c959f9b1c72d809b377cb26891f987c534cb058c13ecbc64adbb7); /* function */ 

coverage_0xe692fa88(0x7f8c2bd58282ae3fc92c1cd0ca3366b4d16f8c4c6cdda5196b650e2f64532173); /* line */ 
        coverage_0xe692fa88(0x16b7199e92cb44ce680d4d698805fa4e14e0a7e758f60abfdd5c499d145afffe); /* statement */ 
uint256 outputAmount;
coverage_0xe692fa88(0xccbaa8bc8f6adb373f2222c477f4b1493dd39346722330a1fb4e53255fee1bf7); /* line */ 
        coverage_0xe692fa88(0x23bb92c21297b8349ce7eeb57018e5617a6c8adc89377488ee32212f414b35bc); /* statement */ 
uint256 makerFillAmount;

coverage_0xe692fa88(0x483893b3709dee2896979c0f553e525250f1cb5374e67cb4e625f6936202ffdf); /* line */ 
        coverage_0xe692fa88(0x6b0d83ba4cfab16a14b7a554d117fadeb028d3c7703124566da2c4f6ed86b5a0); /* statement */ 
if (orderInfo.order.takerMarket == inputMarketId) {coverage_0xe692fa88(0x66b69fa767dda263df1b7979a3a3602729c15c128e3c5fd966415d3d4d4182ff); /* branch */ 

coverage_0xe692fa88(0xdb3bc35082551022a9c370a019efa7cf44a8ddc1c17e80ba2df7e07b68cea69a); /* line */ 
            coverage_0xe692fa88(0xb0c4ff74dc08dce650b2b1cf689655bfbcbe775b7dc95f69f65491a5685acec6); /* statement */ 
outputAmount = inputWei.value.getPartial(
                orderInfo.order.makerAmount,
                orderInfo.order.takerAmount
            );
coverage_0xe692fa88(0xf2448f212656d4b87a7793ac7c7e1dbb2d3c771d89b325f7e61e3469fa0c3d55); /* line */ 
            coverage_0xe692fa88(0xff83cdc111a93cfb07e94527520007153cea153797e6623dbbd238705ce96718); /* statement */ 
makerFillAmount = outputAmount;
        } else {coverage_0xe692fa88(0x574e8fe4aace3c7b80156eb2b83c40778afc98d394414586d5e13753598be557); /* branch */ 

coverage_0xe692fa88(0x6fe3b7472828503b3cf10446c725958390e6200a095a5840d5f610cc055b2d93); /* line */ 
            coverage_0xe692fa88(0x5f12b1b7f6cdce8a10964eab46c3fab547f8680cfcff74edfa9b5dab6bb202cd); /* assertPre */ 
coverage_0xe692fa88(0x493aa5b343fd2499e3d3c3891b31bb06cc16442dc8222ff6cf6864012a7e20da); /* statement */ 
assert(orderInfo.order.takerMarket == outputMarketId);coverage_0xe692fa88(0x239549d756317e9a5501f07b63ffa75b5978519519d306b96a5c2055844afd2e); /* assertPost */ 

coverage_0xe692fa88(0xeda0e12440d30864f12dc13ab41afe203150e11bd72cd1c36e83e28b8c30b34c); /* line */ 
            coverage_0xe692fa88(0x601fd176c9fb4fd2507f08c91b92cc71103f139a7185e205e9cf3666407533d3); /* statement */ 
outputAmount = inputWei.value.getPartialRoundUp(
                orderInfo.order.takerAmount,
                orderInfo.order.makerAmount
            );
coverage_0xe692fa88(0x0f9302f81791534561c77e781419646ee8cab4dd03c2dbc9b1dded481b688fcd); /* line */ 
            coverage_0xe692fa88(0xcc03c458ce2e4c2360df0ee2ff37f523b9b436c1b182919f7cbfa976a93d1d1f); /* statement */ 
makerFillAmount = inputWei.value;
        }

coverage_0xe692fa88(0x9adf8fb26f275c293472c2c239e2a44548726d2874410af4c4e7cf0a5f6d0d9e); /* line */ 
        coverage_0xe692fa88(0x8df0c9936fcb3f56a7c3989f887dfc3ee8c1f595476fed7669cae598a56b1cbc); /* statement */ 
updateMakerFilledAmount(orderInfo, makerFillAmount);

coverage_0xe692fa88(0x8d44467213108b4fd4f86cc3facf2068c6e992fc2e815ee2aa75c27f510102b6); /* line */ 
        coverage_0xe692fa88(0xb3d5193ca110e578292a683268b492971a39db04caa09262306aaf4af51a8b47); /* statement */ 
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
    {coverage_0xe692fa88(0x230a5eb05495c1918539b2d433a80a07a735ec1389beceee7eb74bc3fbb2c9e1); /* function */ 

coverage_0xe692fa88(0xf6a3233b36fba5109e0ec3efb5b176aa77430e7baa5f2be0af8ccac0a9bfd23f); /* line */ 
        coverage_0xe692fa88(0x5c5fdf6bf62560483828697dbc2412ee9854aa6dee57b59224f1057915236919); /* statement */ 
uint256 oldMakerFilledAmount = g_makerFilledAmount[orderInfo.orderHash];
coverage_0xe692fa88(0xe9f4a2d3335eab70ca98f4a56ac6f966ef643b5b42f63810799ff5fcdac7b883); /* line */ 
        coverage_0xe692fa88(0x0673bdf6b207d8a0c3da4421eb724c358c9dd79d43d08b3567a315763677c587); /* statement */ 
uint256 totalMakerFilledAmount = oldMakerFilledAmount.add(makerFillAmount);
coverage_0xe692fa88(0x4eebd83612498061dd9f7c664bf2444c8209e6ab525a81a40c868a317a20ed58); /* line */ 
        coverage_0xe692fa88(0x1885437010d4e251f053f8c86dae82085261c95ab0380f783f863c23c6ff4349); /* statement */ 
Require.that(
            totalMakerFilledAmount <= orderInfo.order.makerAmount,
            FILE,
            "Cannot overfill order",
            orderInfo.orderHash,
            oldMakerFilledAmount,
            makerFillAmount
        );

coverage_0xe692fa88(0xd0cc3edb840a969e5a8de0a324f343c048d6e240f2bb265f4abc84f2915bbc6f); /* line */ 
        coverage_0xe692fa88(0xce23f4258efdf74dc83dcac85ab704943fe2b981d612d6319d6e56881b226109); /* statement */ 
g_makerFilledAmount[orderInfo.orderHash] = totalMakerFilledAmount;

coverage_0xe692fa88(0x6d175be6d4d94bfdb7daaeda5a6a37362001f0e831d831e30baab46b0dd5dda7); /* line */ 
        coverage_0xe692fa88(0x2bda8eefe0245ffa086a24c61a4dd96916bd91911434c2d2e6e98e784f5efdc3); /* statement */ 
emit LogLimitOrderFilled(
            orderInfo.orderHash,
            orderInfo.order.makerAccountOwner,
            makerFillAmount,
            totalMakerFilledAmount
        );
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
    {coverage_0xe692fa88(0x394ed11da469fced2c2c4ad4034675f568c73d096305bdedc9ea958d970644ee); /* function */ 

coverage_0xe692fa88(0x7c1b080ad80e645aad16458e0b089fc61716c830e1fa7bb02d532a5df45a3e39); /* line */ 
        coverage_0xe692fa88(0x5002ffb0d93f1fee649f30859b6d7ce6ba2fcbb3e6dc7f2b5f48975bd7483064); /* statement */ 
Require.that(
            (
                data.length == NUM_ORDER_BYTES ||
                data.length == NUM_ORDER_BYTES + NUM_SIGNATURE_BYTES
            ),
            FILE,
            "Cannot parse order from data"
        );

coverage_0xe692fa88(0xd7a8b17ae8ed0ddb76c7c82ac6e97febc38e1a8ba8ed9c2370009d87c948aaa9); /* line */ 
        coverage_0xe692fa88(0xee53c0b1ad3f8a1e753b59c3e520b84c6ed5b5645202fe45cf550ada9aed193c); /* statement */ 
OrderInfo memory orderInfo;
coverage_0xe692fa88(0xac3b1f7885eed14730d129fe4d267deba321ea6211487a740dedb6a06405352b); /* line */ 
        coverage_0xe692fa88(0x76fae4e0993606d5a44dfcb0f80a68f67700438cdf1ae1c0dc8fdaa547b85ef7); /* statement */ 
orderInfo.order = abi.decode(data, (Order));
coverage_0xe692fa88(0xc93bc45e6ba427e719f85ac7a88a3846b8b3b812f4724afcc484780627e10f4b); /* line */ 
        coverage_0xe692fa88(0x721c9a8a73324cb064422c39ccc0bddbc7517e1f6f757f7b27135bbc36f882fe); /* statement */ 
orderInfo.orderHash = getOrderHash(orderInfo.order);

coverage_0xe692fa88(0x15e004b441ea953ea4b5c4542ca54aa624472ef028d229ad3289c8f1b77104da); /* line */ 
        coverage_0xe692fa88(0xf52b5411d1c3f7fda820aa22cb170bcfd81d19e26e7d123975f110e1ed27b246); /* statement */ 
OrderStatus orderStatus = g_status[orderInfo.orderHash];

        // verify valid signature or is pre-approved
coverage_0xe692fa88(0x643c8c5fae31db372e5c58ffc662ad7084995527a6850315f6b882125cd3fb45); /* line */ 
        coverage_0xe692fa88(0x0ce6267f1ca9e46eff48c115a5b1f8d83552eb911fa12a58293a1c07537d4131); /* statement */ 
if (orderStatus == OrderStatus.Null) {coverage_0xe692fa88(0xa39cd8d4321bd4336212a53a17f3f9794993ea6c146e45966eb8ebe2d5915212); /* branch */ 

coverage_0xe692fa88(0x9365b2bb8612b5857acd950f3ca3a5091fd1c6defc1dc96042cccac7b5d2d0fb); /* line */ 
            coverage_0xe692fa88(0x83fb83b486b156af2ae214ac0b759e3cbb7b9c6c8f34c4cafea6f34be27b3198); /* statement */ 
bytes memory signature = parseSignature(data);
coverage_0xe692fa88(0x8eedb32f2e2bb075d4bac513c1799b23c921be86188b0f15783cbe65d2268f4e); /* line */ 
            coverage_0xe692fa88(0x607c06732a860193a458e0b12b42a357421aa912b06052396f8285813aad78c3); /* statement */ 
address signer = TypedSignature.recover(orderInfo.orderHash, signature);
coverage_0xe692fa88(0x82597146e962bb524a69e9e010b812cb537b24c9c065134f6bb7add9649fc8ef); /* line */ 
            coverage_0xe692fa88(0xba3a85a7df67d529d7b46ed8a335f479afc8845f4572c2f8bfb48fef20b666b9); /* statement */ 
Require.that(
                orderInfo.order.makerAccountOwner == signer,
                FILE,
                "Order invalid signature",
                orderInfo.orderHash
            );
        } else {coverage_0xe692fa88(0xf28435b5e173ba02cdee977e175eefda572900e1a4db23b6d6cab046e3ba4448); /* branch */ 

coverage_0xe692fa88(0x0ad0fc52fa0aaa0ac522ed16c17875d8240c8691373c8c05a7b1a297ae55239b); /* line */ 
            coverage_0xe692fa88(0xf5f79124322d14fde76726a207868b26b8f8b2db3361ee3f3b7196e8f1885787); /* statement */ 
Require.that(
                orderStatus != OrderStatus.Canceled,
                FILE,
                "Order canceled",
                orderInfo.orderHash
            );
coverage_0xe692fa88(0xb59b47da9ee80e2fe0ed441f45e047ef7a815ae118d5cf221eabafc665d4606d); /* line */ 
            coverage_0xe692fa88(0x055cad945ceeb465e7e486175ea9136fb8f4accf015647f5d96c0adbf4708808); /* assertPre */ 
coverage_0xe692fa88(0x70aecb48b462bc7cc2ab772d6e34bd9d001ca8acd918755ae525c95b0321965b); /* statement */ 
assert(orderStatus == OrderStatus.Approved);coverage_0xe692fa88(0x2ffdc0867a65fa4210331d44a370dac277105882fb39aebe53cc6732b70a18db); /* assertPost */ 

        }

coverage_0xe692fa88(0x71f462dd76b2846b0e553e34973143d8a930ba762cd127cb65c5149fbe696c37); /* line */ 
        coverage_0xe692fa88(0xc35c015a7ca22ff84a98d4a1ae765429e0852ebcea0845c73366a4048eb1a679); /* statement */ 
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
    {coverage_0xe692fa88(0xb289099c8e3859439858ebda87ae1dcb98a301bf58bdd1af8d7f952d4ffc2848); /* function */ 

        // compute the overall signed struct hash
        /* solium-disable-next-line indentation */
coverage_0xe692fa88(0xb1be3ec0594ccee5c503f013e2dac3276f816540f9acbc6d53142e3e9c57059f); /* line */ 
        coverage_0xe692fa88(0x104674ecd44d2aa2d2d8a636d4d7aea60b8130532e10d6b263b59fa606b5cdf7); /* statement */ 
bytes32 structHash = keccak256(abi.encode(
            EIP712_LIMIT_ORDER_STRUCT_SCHEMA_HASH,
            order
        ));

        // compute eip712 compliant hash
        /* solium-disable-next-line indentation */
coverage_0xe692fa88(0xec78f6bf87b3717b2b26594a5a8ade3752b2ca36d046d8def822d45b8d0ffcc4); /* line */ 
        coverage_0xe692fa88(0x5fc41715fecef9dbec5bdc8dd79eba2fa583dd18b7d597cde5be409cbdfbd5e6); /* statement */ 
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
    {coverage_0xe692fa88(0x2dfee5c2d57b0e5bee581a234a3d4e14d3dec5bed3ca311d4fa89e5787c2edc2); /* function */ 

coverage_0xe692fa88(0x757664b8750c09eb745208433ae1bdcf8dd4971a171762a91296253c83807270); /* line */ 
        coverage_0xe692fa88(0x033d71068f86ee23484fbdcc17f1d62868f595b37ae2676bf0c3719a4d9e8034); /* statement */ 
Require.that(
            data.length == NUM_ORDER_BYTES + NUM_SIGNATURE_BYTES,
            FILE,
            "Cannot parse signature from data"
        );

coverage_0xe692fa88(0x28f8489a6015c3580406af8c8ea8d3653306a477ec27415ab022ad3e24af60a0); /* line */ 
        coverage_0xe692fa88(0x87897b6f7b2f33814b08ffdef8c90ebeeb9f35f5fa72150344f45367488655dc); /* statement */ 
bytes memory signature = new bytes(NUM_SIGNATURE_BYTES);

coverage_0xe692fa88(0x149bb74ce50a575339f2e81b1840ce0d84e6d525673ec8bb735f0fbee7e4c763); /* line */ 
        coverage_0xe692fa88(0xa90d15d38860c79210f9bda2385d69b9968e594364df061b3eb9a2df233c2e03); /* statement */ 
uint256 sigOffset = NUM_ORDER_BYTES;
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0xe692fa88(0x5950a4f8abcd7ccc95c91a22d92b122b8b124146de09e071c5e6477b988ec27e); /* line */ 
        assembly {
            let sigStart := add(data, sigOffset)
            mstore(add(signature, 0x020), mload(add(sigStart, 0x20)))
            mstore(add(signature, 0x040), mload(add(sigStart, 0x40)))
            mstore(add(signature, 0x042), mload(add(sigStart, 0x42)))
        }

coverage_0xe692fa88(0x05e11c4692698d4a6fe0142832f02cc137ee89bcc9ec18978c1a3de2833145f6); /* line */ 
        coverage_0xe692fa88(0xcbf436e98e903b064144fbad5b6f961195d3395eba3563ad99553ce4c3594096); /* statement */ 
return signature;
    }
}
