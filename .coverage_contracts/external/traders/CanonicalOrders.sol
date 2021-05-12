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
 * @title CanonicalOrders
 * @author dYdX
 *
 * Allows for Canonical Orders to be used with dYdX
 */
contract CanonicalOrders is
    Ownable,
    OnlySolo,
    IAutoTrader,
    ICallee
{
function coverage_0x3208e528(bytes32 c__0x3208e528) public pure {}

    using Math for uint256;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant private FILE = "CanonicalOrders";

    // EIP191 header for EIP712 prefix
    bytes2 constant private EIP191_HEADER = 0x1901;

    // EIP712 Domain Name value
    string constant private EIP712_DOMAIN_NAME = "CanonicalOrders";

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

    // Hash of the EIP712 CanonicalOrder struct
    /* solium-disable-next-line indentation */
    bytes32 constant private EIP712_ORDER_STRUCT_SCHEMA_HASH = keccak256(abi.encodePacked(
        "CanonicalOrder(",
        "bytes32 flags,",
        "uint256 baseMarket,",
        "uint256 quoteMarket,",
        "uint256 amount,",
        "uint256 limitPrice,",
        "uint256 triggerPrice,",
        "uint256 limitFee,",
        "address makerAccountOwner,",
        "uint256 makerAccountNumber,",
        "uint256 expiration",
        ")"
    ));

    // Number of bytes in an Order struct plus number of bytes in a FillArgs struct
    uint256 constant private NUM_ORDER_AND_FILL_BYTES = 416;

    // Number of bytes in a typed signature
    uint256 constant private NUM_SIGNATURE_BYTES = 66;

    // The number of decimal places of precision in the price ratio of a triggerPrice
    uint256 constant private PRICE_BASE = 10 ** 18;

    // Bitmasks for the order.flag argument
    bytes32 constant private IS_BUY_FLAG = bytes32(uint256(1));
    bytes32 constant private IS_DECREASE_ONLY_FLAG = bytes32(uint256(1 << 1));
    bytes32 constant private IS_NEGATIVE_FEE_FLAG = bytes32(uint256(1 << 2));

    // ============ Enums ============

    enum OrderStatus {
        Null,
        Approved,
        Canceled
    }

    enum CallFunctionType {
        Approve,
        Cancel,
        SetFillArgs
    }

    // ============ Structs ============

    struct Order {
        bytes32 flags; // salt, negativeFee, decreaseOnly, isBuy
        uint256 baseMarket;
        uint256 quoteMarket;
        uint256 amount;
        uint256 limitPrice;
        uint256 triggerPrice;
        uint256 limitFee;
        address makerAccountOwner;
        uint256 makerAccountNumber;
        uint256 expiration;
    }

    struct FillArgs {
        uint256 price;
        uint128 fee;
        bool isNegativeFee;
    }

    struct OrderInfo {
        Order order;
        FillArgs fill;
        bytes32 orderHash;
    }

    struct OrderQueryOutput {
        OrderStatus orderStatus;
        uint256 filledAmount;
    }

    // ============ Events ============

    event LogContractStatusSet(
        bool operational
    );

    event LogTakerSet(
        address taker
    );

    event LogCanonicalOrderCanceled(
        bytes32 indexed orderHash,
        address indexed canceler,
        uint256 baseMarket,
        uint256 quoteMarket
    );

    event LogCanonicalOrderApproved(
        bytes32 indexed orderHash,
        address indexed approver,
        uint256 baseMarket,
        uint256 quoteMarket
    );

    event LogCanonicalOrderFilled(
        bytes32 indexed orderHash,
        address indexed orderMaker,
        uint256 fillAmount,
        uint256 triggerPrice,
        bytes32 orderFlags,
        FillArgs fill
    );

    // ============ Immutable Storage ============

    // Hash of the EIP712 Domain Separator data
    bytes32 public EIP712_DOMAIN_HASH;

    // ============ Mutable Storage ============

    // true if this contract can process orders
    bool public g_isOperational;

    // order hash => filled amount (in baseAmount)
    mapping (bytes32 => uint256) public g_filledAmount;

    // order hash => status
    mapping (bytes32 => OrderStatus) public g_status;

    // stored fillArgs
    FillArgs public g_fillArgs;

    // required taker address
    address public g_taker;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        address taker,
        uint256 chainId
    )
        public
        OnlySolo(soloMargin)
    {coverage_0x3208e528(0xb129270c943197bed656b4d212018cae27b8693ab231bf0ff9f0e43d277130e7); /* function */ 

coverage_0x3208e528(0x70f2e7184c616a937f308c8c3d839bc1f324b855bddd5476acff49cdf51514cb); /* line */ 
        coverage_0x3208e528(0xd6b1536b2ecedc1f02886eafbeeb8b06f5eda54087c76241bd790b497eaeab7b); /* statement */ 
g_isOperational = true;
coverage_0x3208e528(0xec79641abe9d917d193fd0287829ca2f1bfd1aa4973e339310b83862337d7121); /* line */ 
        coverage_0x3208e528(0xc66a77d70bf75aaeb579860ff34d146e721c688a760ecbeb96e1645e156ce38f); /* statement */ 
g_taker = taker;

        /* solium-disable-next-line indentation */
coverage_0x3208e528(0x3916318e0824791184568acf15846e26a32613b0e75f35106e310526f8a0d98a); /* line */ 
        coverage_0x3208e528(0xa75cf804ba86123af43605a2e336c9dbb5f39eca5bc62533ffc832285d92913a); /* statement */ 
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
    {coverage_0x3208e528(0x22fd20c34f04b7522ce1631abbba1aa5d05b64d6d6721b06afe2a28613367e74); /* function */ 

coverage_0x3208e528(0x57c4a965412a92700a8e696ea16b0d3f30858ab95e1d989fea2987f509f64c02); /* line */ 
        coverage_0x3208e528(0x64a62cdcd3df84eccbdd27d9fce5668f7d64cba1c1b8f6364186fe06eee75be5); /* statement */ 
g_isOperational = false;
coverage_0x3208e528(0xa28ddf1903ffe84287e4dc94e86b7633d0f5570c85066f3918d679e79dfff381); /* line */ 
        coverage_0x3208e528(0x0fbb847129ab57e0ca0de42b086b42ca027f8fb9b98f8cd24c256d3e99ef18b6); /* statement */ 
emit LogContractStatusSet(false);
    }

    /**
     * The owner can start back up the exchange.
     */
    function startUp()
        external
        onlyOwner
    {coverage_0x3208e528(0xdea1ce8d9d2932b33a83bb1b38abfb7be89142dda1dc29bad9003efd1bba4ec4); /* function */ 

coverage_0x3208e528(0x55c0804cfaeeb07fd9f27a198692142c4a28a375c20d9784b8a887a29356087a); /* line */ 
        coverage_0x3208e528(0xc1823a6234a9d48ae08b145013a4e925a0e48216a182167ed4fb654194f93841); /* statement */ 
g_isOperational = true;
coverage_0x3208e528(0x244d5a3cc06f41b357b083d5b3ae8b622e888eb1c9be7e1604b20557172308de); /* line */ 
        coverage_0x3208e528(0xc3f6948f65ea09b32570b8bea312cf6d96ca9f82a16f589ca9f1ab9f925090d5); /* statement */ 
emit LogContractStatusSet(true);
    }

    /**
     * The owner can set the taker address.
     */
    function setTakerAddress(
        address taker
    )
        external
        onlyOwner
    {coverage_0x3208e528(0xc333ca8e5c14bcb96ef01956abb0893c3cefa25e4ddc168d7c9e181be542084e); /* function */ 

coverage_0x3208e528(0xaa0fb1718eac07f33a9324fa029f84ca88cd2c86512ec4b39b6cb12922b114c1); /* line */ 
        coverage_0x3208e528(0xe8fefa9e7e059311a2f590feaff3525427f6f897b9626a410307a83662662ebb); /* statement */ 
g_taker = taker;
coverage_0x3208e528(0xa9be0bfc94c6bf925063f2b72093caeb72680ec82f2a93b2dbe5f6e200772b4e); /* line */ 
        coverage_0x3208e528(0xdd2baa0c425442d376a4b3467dedbf84d797ebe6bbcac094d36c5f395493b206); /* statement */ 
emit LogTakerSet(taker);
    }

    // ============ External Functions ============

    /**
     * Cancels an order.
     *
     * @param  order  The order to cancel
     */
    function cancelOrder(
        Order memory order
    )
        public
    {coverage_0x3208e528(0x62ec72617893fbe3d0937a15227331426c4c0ef9aafe9b4f996f512b0b00a8f7); /* function */ 

coverage_0x3208e528(0x8156320b58b08eec786d5de2e4634c582288e1d36ae19fb6279191d2c9c205cb); /* line */ 
        coverage_0x3208e528(0xe08a7d24308841105032ee2a1c50c7ebae135fbfc4fcd9dd913cad69bea160c1); /* statement */ 
cancelOrderInternal(msg.sender, order);
    }

    /**
     * Approves an order. Cannot already be canceled.
     *
     * @param  order  The order to approve
     */
    function approveOrder(
        Order memory order
    )
        public
    {coverage_0x3208e528(0xc4bac8792dd5597daa339d192c2075a4a6d770d344e63335ddc48236ad4d70b0); /* function */ 

coverage_0x3208e528(0x5fb9e93bea25b9a54a5d0eb3f5c3d85b2a97d55fa50a0b1955f8d8cce32b6324); /* line */ 
        coverage_0x3208e528(0x53005369159477245a37e734bd72af786043233e9d6f366c6a6fed75b0778552); /* statement */ 
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
    {coverage_0x3208e528(0x2faaf6d4abada88656a79e6c3f47abc6f939d84a8a4f6e8f0655ad91e4d7dd64); /* function */ 

coverage_0x3208e528(0x33adb19eb3dd02e448342dd5b5bec6db92c60cfe110a684bc82c81b31f921fd4); /* line */ 
        coverage_0x3208e528(0x501c9091212644404a1415a12cac5dd7716d0622050e62ae57507b00cbf966c1); /* statement */ 
Require.that(
            g_isOperational,
            FILE,
            "Contract is not operational"
        );

coverage_0x3208e528(0x07b1a13c8cc081588a3e11181b43c8eadf94f160489552265ffb34db31e29928); /* line */ 
        coverage_0x3208e528(0x889cd2df24a8166b16d50853d61ec5c6aec99cd17004a4fb279003947289134c); /* statement */ 
OrderInfo memory orderInfo = getOrderInfo(data);

coverage_0x3208e528(0x277a1fd457a40d412dcd26b86de412d45471208ba0fdfb017f32340f0643fbfb); /* line */ 
        coverage_0x3208e528(0x9f6094d2b8eba9e0e3030bb1703877f04e8e63a2b329ca89ca9aa36bc663a4cf); /* statement */ 
verifySignature(orderInfo, data);

coverage_0x3208e528(0x190a6604551409417889c4d61c971fa297b2e9cac8c0a10166aec2aa7dafa0b0); /* line */ 
        coverage_0x3208e528(0x15e13177f428a2a95012eefdc03adc77f2bf119f413b07ce12818b45b0cdd271); /* statement */ 
verifyOrderInfo(
            orderInfo,
            makerAccount,
            takerAccount,
            inputMarketId,
            outputMarketId,
            inputWei
        );

coverage_0x3208e528(0x2a0f4277f5f95e9173eb2cd044d34b33c8a2418381f52ef5ee0c1d9a31fb605d); /* line */ 
        coverage_0x3208e528(0x591796d01d6ceb01d91f4d26b87b1636e3f472a47632a058b50c4902a02216a3); /* statement */ 
Types.AssetAmount memory assetAmount = getOutputAssetAmount(
            inputMarketId,
            outputMarketId,
            inputWei,
            orderInfo
        );

coverage_0x3208e528(0xa2b8ae88df03a64a25345d21af32f6df6ae9a3e3eda76684af5aa6ffd1d8f7b6); /* line */ 
        coverage_0x3208e528(0x47067769694f262efd7bedde09e3381d27dfe687bba32cfb93cb702b03c69ab6); /* statement */ 
if (isDecreaseOnly(orderInfo.order)) {coverage_0x3208e528(0xd2bb4a63d95272cba46cccc5d7af827dad186f3528a4e6af2aa03007d46a8b62); /* branch */ 

coverage_0x3208e528(0x4848ced1e8209fb9139143cbae331c07fccdf1c02201d40e2d1e369a6984169b); /* line */ 
            coverage_0x3208e528(0x3fbe1ab22cfd4ab2f0eacb7576453699eeae60fde80a90f52aa0ac0b7a1bc1e1); /* statement */ 
verifyDecreaseOnly(
                oldInputPar,
                newInputPar,
                assetAmount,
                makerAccount,
                outputMarketId
            );
        }else { coverage_0x3208e528(0x576a791c4832e83da9ee6498e23afbea583903202f7bbbf07a270e0dfe2f3b1f); /* branch */ 
}

coverage_0x3208e528(0x937db22bd9b1be63630f7306252864d02ca4f5080d4c1a0a74caade352e4d19d); /* line */ 
        coverage_0x3208e528(0x399f3ab65ddf7111154a184e412fdac8838e2d0f96a93fb428ca9660ac35f127); /* statement */ 
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
    {coverage_0x3208e528(0x522313ac0d94e419c2e8289693549a937fae8bc3d7629493cb065fa7c2c1a630); /* function */ 

coverage_0x3208e528(0xcab586c934d675fee8c27b89c2ad068206d69bc6c7621c954a8ec73bfdd8c58a); /* line */ 
        coverage_0x3208e528(0xf357bd8fb3e78222ab945035d410ce7575948f58a1e20b2807f375099e008b21); /* statement */ 
CallFunctionType cft = abi.decode(data, (CallFunctionType));

coverage_0x3208e528(0xd167815f22bb00dce8fd4d4f921261f191a8dee079d7ce58feac3a5ffde71dda); /* line */ 
        coverage_0x3208e528(0x2279bd2f3dee9a56409000f9b29d4f400a16360807d1d9f673fc1c5ac5b36a2f); /* statement */ 
if (cft == CallFunctionType.SetFillArgs) {coverage_0x3208e528(0x4479bd29a6c06534b49c8a5b62c384c9043e243d185add81cb4f2274582013f2); /* branch */ 

coverage_0x3208e528(0xeb96659fcf89ce42274744e1e30aef69087d3ae8c1d9698d8b7213d2e2f71c51); /* line */ 
            coverage_0x3208e528(0x76de3375f3d110ce0dd99c087405f3361bdf0336d26ea43fcdc2e640c2df2e19); /* statement */ 
FillArgs memory fillArgs;
coverage_0x3208e528(0xe99de4ab4659dbd9d096250a0dc52a2a610153012c2cd18a8f184acfeb97389b); /* line */ 
            coverage_0x3208e528(0x2fa12e031102c8c975557156c8ade12cb8b4ef640e715a0cc1839eec870ac618); /* statement */ 
(cft, fillArgs) = abi.decode(data, (CallFunctionType, FillArgs));
coverage_0x3208e528(0xd1ad797c2cb61daf63e13846b0ab306ec8cfd7ec3e74c129d1f69586d378fae2); /* line */ 
            coverage_0x3208e528(0x817b46236155ca9f822557f15849dfc3688a278dfa49a34c7aaf6259c21cc1d8); /* statement */ 
g_fillArgs = fillArgs;
        } else {coverage_0x3208e528(0x0525c4d06c0377ad191bcccf1a06bac6e7f7982582b7f067c8e74d63d58ab0b4); /* branch */ 

coverage_0x3208e528(0x111a7e0d8d893e4db2707e7f4c9c3149ea5eb48fb2c9b0137e2778a99dcfc07d); /* line */ 
            coverage_0x3208e528(0x764b5dc876ced5a7e46733d27fddbfa99ee553fb96bb6da7d389b334beacb7e7); /* statement */ 
Order memory order;
coverage_0x3208e528(0x73ec17da913a00ce17fb6c59690d61da918867203c34774d1d786e9cc6a7f4fc); /* line */ 
            coverage_0x3208e528(0xaa5cf0aad50686e32b8b6fd7b60f75e349fc8ad4631e3d76f7a4d3d6e65b940a); /* statement */ 
(cft, order) = abi.decode(data, (CallFunctionType, Order));
coverage_0x3208e528(0xfa063e2fe0d0d3d0bc0f344b8375bd965ff85cbcbeee1192174beab5da9228bf); /* line */ 
            coverage_0x3208e528(0xf2c8c49b6f32e2e2ad20926b3cbc33be73c5ffd76a4c5d2c6689bf18af087106); /* statement */ 
if (cft == CallFunctionType.Approve) {coverage_0x3208e528(0x589bcb732ad14a40ca7ff4883fdb82fa8c7cc8dbb12fbd590c60da5eb40118c5); /* branch */ 

coverage_0x3208e528(0x69dc0ffd44adff7ce5b37f9a5f2b97230c85bc297f20485b45a254d7cd684721); /* line */ 
                coverage_0x3208e528(0x85c518c2a23125aa8902841423d6d2e5a61ac9575e8a409e0b143578b655538c); /* statement */ 
approveOrderInternal(accountInfo.owner, order);
            } else {coverage_0x3208e528(0x76d8340da083b48d69ff6a035fbf2334348cf7b71957c1eb083d1b4a6d6f3cba); /* branch */ 

coverage_0x3208e528(0x3950ce40ddb572d3dd215c9c13129c39c2cc2369b784d84a854c1b7fa34c8582); /* line */ 
                coverage_0x3208e528(0x987105263febadc0c6e0f471023a13661a5632f1271a44fdfb821826ee7b6ef1); /* assertPre */ 
coverage_0x3208e528(0x50c1baf0ce98697b6e872aca4046af97705135220c46baab5f12bdced30e7871); /* statement */ 
assert(cft == CallFunctionType.Cancel);coverage_0x3208e528(0x54ab9bf8e6f357afa9aa4a8e8beaa181ff071e9952a5a17ba1433f1f1c34a5c1); /* assertPost */ 

coverage_0x3208e528(0x13da4f86a17a299a5e9cb54a786dfbe71a0a4fa0bd72552ed3be99a0edaab090); /* line */ 
                coverage_0x3208e528(0xc3f07df6a5ce265f069f1ff8f8df5ed55b7a733b6d631ec25527da1dc3e83877); /* statement */ 
cancelOrderInternal(accountInfo.owner, order);
            }
        }
    }

    // ============ Getters ============

    /**
     * Returns the status and the filled amount of several orders.
     */
    function getOrderStates(
        bytes32[] memory orderHashes
    )
        public
        view
        returns(OrderQueryOutput[] memory)
    {coverage_0x3208e528(0x546346b13996e1f6973e4d00d7a6787e83a7034c22cc21db7ff8b4f06b756e00); /* function */ 

coverage_0x3208e528(0xd172aeef6f7227bbe802c7ff87b3c1d8e8a9950955482a2152e0dfc5baadaa43); /* line */ 
        coverage_0x3208e528(0x4584d18bf7709560e08e535653ee0561f24d7bbeb35e6840880e2a02b221360d); /* statement */ 
uint256 numOrders = orderHashes.length;
coverage_0x3208e528(0x5ed4c5d020ae18ae60b204f0523257dd6e634f4d2b2218d676ef6c96afbf05b4); /* line */ 
        coverage_0x3208e528(0xea9efe4f9347a9c3ca867835a5721e1ec5fde519b6c5652c091c9dde90949ef0); /* statement */ 
OrderQueryOutput[] memory output = new OrderQueryOutput[](numOrders);

        // for each order
coverage_0x3208e528(0x3e020d5c9eb97d1317c80c10c2c7aaf85e4f976bdac44f2774a89701a121bf6f); /* line */ 
        coverage_0x3208e528(0x4d37270da1f31acf44067a505ea100e2ff5508fe3ec8f2bf57d51298c0a668b6); /* statement */ 
for (uint256 i = 0; i < numOrders; i++) {
coverage_0x3208e528(0xbba270b1e626dc940517b539fe4bd3b2806c1ce44efe15ed6ce23ddd7a3be492); /* line */ 
            coverage_0x3208e528(0x2f32fe573bf7bcc31c79f995a2dfebecab6174fd27b2613d2d74de6aede87cb9); /* statement */ 
bytes32 orderHash = orderHashes[i];
coverage_0x3208e528(0x0d79a29e5adf0a22506b65ac5533e3cd661021626f6bc042eb64dbd3a18f8613); /* line */ 
            coverage_0x3208e528(0x1f197da78c172c319abf559653e4ff90f4447c6c42e55f89b15f5f065d8f0ec0); /* statement */ 
output[i] = OrderQueryOutput({
                orderStatus: g_status[orderHash],
                filledAmount: g_filledAmount[orderHash]
            });
        }
coverage_0x3208e528(0x14532840fb69e00b3ed7206d693fc05f125b4ff536a4a8071b1fb821e8da743d); /* line */ 
        coverage_0x3208e528(0xd022edd82e67b77f37f2c83fc8516afec7afb7b71e4fdd36304071a345b471b0); /* statement */ 
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
    {coverage_0x3208e528(0xb9b5314f2f594a291dcf27879618b9d469f4df5746c0d028e20a39c31ff13e9c); /* function */ 

coverage_0x3208e528(0x6da419145fd7aec01a0c2a9bc54e922221470d6a185bb80e58c1af3a16f83bf5); /* line */ 
        coverage_0x3208e528(0x40674bfff00914484b7138fc5363813b67984a081f45bfa10d90bde84b9cec05); /* statement */ 
Require.that(
            canceler == order.makerAccountOwner,
            FILE,
            "Canceler must be maker"
        );
coverage_0x3208e528(0xb3429bd73fb9b4d2fc43d5a1c6f5d596703aff5df1c3af5a3c240321b3f0a620); /* line */ 
        coverage_0x3208e528(0xcd45fedb65dc0215f2e95be9371f3c7c1d5622e554dc3715792a11cb5061aa41); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0x3208e528(0xbc3073d3821cb2c931cc9126ccc0eeb6f4009ccc917cb4826ccc092c3d60f1e5); /* line */ 
        coverage_0x3208e528(0xad83f39491b29d219c2aeb2c59d4834d2fa00b09504578d7c0ee4840767a4403); /* statement */ 
g_status[orderHash] = OrderStatus.Canceled;
coverage_0x3208e528(0xcf1cac6c93ea74eddd6cd5a10939b25626e66daab46385790bd5c90c827ee8e1); /* line */ 
        coverage_0x3208e528(0xc4174f643cfeee4ec06a5f5b3e2d817da1d29dae48cbb201d23f2a2f1aee58ac); /* statement */ 
emit LogCanonicalOrderCanceled(
            orderHash,
            canceler,
            order.baseMarket,
            order.quoteMarket
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
    {coverage_0x3208e528(0x3d15b6649e6d37c9968f4355bee591edf2a32b30cd2b1a8f7cd68e8990d6ffea); /* function */ 

coverage_0x3208e528(0x9ceb18e5a2e3ec51832a96606bd0153695a805af702f8051dda158800e317caf); /* line */ 
        coverage_0x3208e528(0x85b1067757ebfbfe068b968445eba55262cae9f2e21ffaff9db854c684f853be); /* statement */ 
Require.that(
            approver == order.makerAccountOwner,
            FILE,
            "Approver must be maker"
        );
coverage_0x3208e528(0x3830c88c2c51af076dfdb83023ec828ba9d95c0d618561cc0f3bec4ab67799f2); /* line */ 
        coverage_0x3208e528(0xeb7f706c03ed31186850200ec6695c6e7dc6fbee2968482c857021c9fbb91a98); /* statement */ 
bytes32 orderHash = getOrderHash(order);
coverage_0x3208e528(0x4ebb98d47bd65bdac2a0da35195aa5964092f19d0b785cac290f2ccc0d00c967); /* line */ 
        coverage_0x3208e528(0xa691f7f3dcb572e6382a26a85ada9bad31d55d5164c2ba419eaeea557d66935b); /* statement */ 
Require.that(
            g_status[orderHash] != OrderStatus.Canceled,
            FILE,
            "Cannot approve canceled order",
            orderHash
        );
coverage_0x3208e528(0x429befc98028cb23e7b16a21bd022ae22406cc62a5a273ca486b96f5cd7ecb93); /* line */ 
        coverage_0x3208e528(0x527acdd6338fd3409edd0d6da61bf41e82975d1f404db5a6c6469191974c3172); /* statement */ 
g_status[orderHash] = OrderStatus.Approved;
coverage_0x3208e528(0x00c00042c21d2787d0d42bf3407cc018e7111726e28974e6f0ef802defadbe08); /* line */ 
        coverage_0x3208e528(0x9a8ebede0cc7096d14f9d2f119aef61531edc35ad6ec116e08aa58292834edd5); /* statement */ 
emit LogCanonicalOrderApproved(
            orderHash,
            approver,
            order.baseMarket,
            order.quoteMarket
        );
    }

    // ============ Private Helper Functions ============

    /**
     * Parses the order, verifies that it is not expired or canceled, and verifies the signature.
     */
    function getOrderInfo(
        bytes memory data
    )
        private
        returns (OrderInfo memory)
    {coverage_0x3208e528(0x3b9579c13491f26bc434b856209be3bb28b43571c81ea3ce22f70c3dc509ef0f); /* function */ 

coverage_0x3208e528(0x7740241abfd1b90ab8e74fe9799f497b4bcf5460fe8924c3ea284df1a4ce304e); /* line */ 
        coverage_0x3208e528(0x1d8808fb8acfe8db0aaf544b97e2299dbb29b3543482a48def6b43306239dde9); /* statement */ 
Require.that(
            (
                data.length == NUM_ORDER_AND_FILL_BYTES ||
                data.length == NUM_ORDER_AND_FILL_BYTES + NUM_SIGNATURE_BYTES
            ),
            FILE,
            "Cannot parse order from data"
        );

        // load orderInfo from calldata
coverage_0x3208e528(0xd20366efb3df301e9b0d448234c5df7055f15d2e7ea6fcf38aba2622246f3c82); /* line */ 
        coverage_0x3208e528(0x2526accd6182d9f80cabc8813f22060ce101028561f886854d8c674a044c275e); /* statement */ 
OrderInfo memory orderInfo;
coverage_0x3208e528(0x58f1cff6e12f24a0cd5e2c87832972d50042d2c8313b6d0dba41d56cb2884a2e); /* line */ 
        coverage_0x3208e528(0x849bdefa66f136a7aee7bf34b64bb5cbf465137ffdebab03c656b50c18133961); /* statement */ 
(
            orderInfo.order,
            orderInfo.fill
        ) = abi.decode(data, (Order, FillArgs));

        // load fillArgs from storage if price is zero
coverage_0x3208e528(0x207f96b70a2ecc73aa8a521c6c8e2a6360ea23a99ca9da58f9b286fabcb7f229); /* line */ 
        coverage_0x3208e528(0xdf74bda447700f30dbf90cb33d3817f975577b490a51cf61d8cdfab1bbff5b78); /* statement */ 
if (orderInfo.fill.price == 0) {coverage_0x3208e528(0x7b7d623272a244dcfd98fe5f5850a3ac91be77f69e13bae02cfb4f40a08c37b7); /* branch */ 

coverage_0x3208e528(0xff004d58fcc0acb1c41f436aea948b8009845a1db7f7cc10a192714b3035b650); /* line */ 
            coverage_0x3208e528(0x7434ee8deeed5bac053b864bcef736b64b84d17edc3eaf953f4c5c49e92ff305); /* statement */ 
orderInfo.fill = g_fillArgs;
coverage_0x3208e528(0x01db03a4f0de681e0f03c5d28533b2f62bbe48b41adfad25127cb30a21ef6dd4); /* line */ 
            coverage_0x3208e528(0xd464d4c63eec04172971f8e13e054e0833840e99f00fb4d51705f7e89a44c2b2); /* statement */ 
g_fillArgs = FillArgs({
                price: 0,
                fee: 0,
                isNegativeFee: false
            });
        }else { coverage_0x3208e528(0xf15a00aec57605b98f58b32026359869e19540a368df3f217b8dabd0ef35149c); /* branch */ 
}
coverage_0x3208e528(0x09d55b387178c5f7f1b5dd07690923fd674ba0a094bca6a1f2cf95f18f75d1f9); /* line */ 
        coverage_0x3208e528(0x3e9b47e63324ec0366c475b69c6726e485e27635c1cc1bc3a62c17a13acfc947); /* statement */ 
Require.that(
            orderInfo.fill.price != 0,
            FILE,
            "FillArgs loaded price is zero"
        );

coverage_0x3208e528(0x36773b3064dc0ee63433131e9a3fc56d4ea1507fe2891a3f62706474f772adb3); /* line */ 
        coverage_0x3208e528(0xd4e176699cf533a8203bd58d10da00b56fde86f5ca6942f49216a2a12b6b60d4); /* statement */ 
orderInfo.orderHash = getOrderHash(orderInfo.order);

coverage_0x3208e528(0xcbb215dc4ab075e279d52cb3f9510ce83a28ff43b89b662a79bf9544bfb0b228); /* line */ 
        coverage_0x3208e528(0xfa6c07929d96220458e6ef1487d56f49bae75a6d8f83b132be845e6fc88383cc); /* statement */ 
return orderInfo;
    }

    function verifySignature(
        OrderInfo memory orderInfo,
        bytes memory data
    )
        private
        view
    {coverage_0x3208e528(0x88a1c32f71cbfd29f8f41f6763512c2cab479e12add28417fd9d339ac04293d7); /* function */ 

coverage_0x3208e528(0xf785b9d73724ae6d12e7e333b670cca0b18ee21c587ccea941ca5a26b6f5cb33); /* line */ 
        coverage_0x3208e528(0x7a6add36715493962068b19aa6dfddcd189411ab7a674ecde4c6500978e59cc8); /* statement */ 
OrderStatus orderStatus = g_status[orderInfo.orderHash];

        // verify valid signature or is pre-approved
coverage_0x3208e528(0xbcc0c923af8e2b8af0c15226fe588d2f6e528a08cd79ce079d2616d5a89a28cf); /* line */ 
        coverage_0x3208e528(0xc03688b37c738d18729a62ba8654134886af05c62c07f2a420a561c17b5a477a); /* statement */ 
if (orderStatus == OrderStatus.Null) {coverage_0x3208e528(0xaaf45f1f1a23634af224e0e722ae7d1260edc490bd99231af267de1084264fec); /* branch */ 

coverage_0x3208e528(0x484eadd4b76e2369674a3ecc4e48a30ac1bf42e35f21ad38ff3dcf96b57c3f83); /* line */ 
            coverage_0x3208e528(0x16fe195cc635be0e3a245594f5e380bda85727c509a1fff73fc4b7f5d63a70bc); /* statement */ 
bytes memory signature = parseSignature(data);
coverage_0x3208e528(0xb54f468a080d45043b7c1e8392e43ef41725eec44bf0e7e28917bef2e7963176); /* line */ 
            coverage_0x3208e528(0x37423016f65fb0ff2b3f7ce625916bfcbe8a70bdea44c220b3d4905db3e07fef); /* statement */ 
address signer = TypedSignature.recover(orderInfo.orderHash, signature);
coverage_0x3208e528(0x069d6312814a66f69c301f95b713b623a5d902b23aa7723ad039f83e518aab73); /* line */ 
            coverage_0x3208e528(0x3f94fd71c5ce7417e6dbf1082b8c49eea33680b2dbf69754e558efe6f11bfd18); /* statement */ 
Require.that(
                orderInfo.order.makerAccountOwner == signer,
                FILE,
                "Order invalid signature",
                orderInfo.orderHash
            );
        } else {coverage_0x3208e528(0xd24cf14c76ee001e55900c14d714e7bc5a7d644bb9e3f8f90bdc70c914bb6792); /* branch */ 

coverage_0x3208e528(0x1e29e265c9a85b70b0e04c800ffe68d631b3d7eaf1e583481a7ae49d3941d658); /* line */ 
            coverage_0x3208e528(0xb652e3c3172505deb2be28f09d2ea4ae8409f857d886be4e8a2df09d040ebf94); /* statement */ 
Require.that(
                orderStatus != OrderStatus.Canceled,
                FILE,
                "Order canceled",
                orderInfo.orderHash
            );
coverage_0x3208e528(0x4e6c489471ed82a6c694af2edff1291e5248d085721604665fffc48ea3f36311); /* line */ 
            coverage_0x3208e528(0xba53270140e3243697d6b5f3a9917af4d5d4af1ff59585981528a871ffb63835); /* assertPre */ 
coverage_0x3208e528(0xbbc4e3b8d2923d420bfd31447b3672c6bcfbec628709ff3d48a5340ce854c2ed); /* statement */ 
assert(orderStatus == OrderStatus.Approved);coverage_0x3208e528(0xe4b021b5cf0e5af0f6c3c837090810f9eb8fdd84bf523a8a8d38dcb503b3c1f9); /* assertPost */ 

        }
    }

    /**
     * Verifies that the order is still fillable for the particular accounts and markets specified.
     */
    function verifyOrderInfo(
        OrderInfo memory orderInfo,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        uint256 inputMarketId,
        uint256 outputMarketId,
        Types.Wei memory inputWei
    )
        private
        view
    {coverage_0x3208e528(0x69727e19a6fe5fca54bdae676b6dbf134b482b301624ae3a5af1cd15e92f8720); /* function */ 

        // verify fill price
coverage_0x3208e528(0x654310bd2053ed51945d93d68ddcab02be9da661fa6cd8154ee4018674b2e2c5); /* line */ 
        coverage_0x3208e528(0x2f87181586fb164faa291a7665b3d3c722dbc406edf91c2af7b6c0af0fe8fb23); /* statement */ 
FillArgs memory fill = orderInfo.fill;
coverage_0x3208e528(0x9481269e1bd47c3925823be735c173cd910e8e619720e01d122e53de1e6c1ac7); /* line */ 
        coverage_0x3208e528(0xf17db18241fd48aaa51c77a7d17f50699c8d899550c7e9dc1328ac557c252380); /* statement */ 
bool validPrice = isBuy(orderInfo.order)
            ? fill.price <= orderInfo.order.limitPrice
            : fill.price >= orderInfo.order.limitPrice;
coverage_0x3208e528(0xac1312b81f66b1f12282b8f250e8670a1165b70d16d917a1312bafc36d31585b); /* line */ 
        coverage_0x3208e528(0xfa657e22a8ccf00385f69c992999bddd5f713a068149724747f42bf4e61e88d4); /* statement */ 
Require.that(
            validPrice,
            FILE,
            "Fill invalid price"
        );

        // verify fill fee
coverage_0x3208e528(0x8692531a13ea4f04756d211287f720344597fd62ce4278f44625c5471639a61e); /* line */ 
        coverage_0x3208e528(0xe7e807b63bd24f714786de67db0fd08588cd6ea12e397d081c14b5e794f0d3d1); /* statement */ 
bool validFee = isNegativeLimitFee(orderInfo.order)
            ? (fill.fee >= orderInfo.order.limitFee) && fill.isNegativeFee
            : (fill.fee <= orderInfo.order.limitFee) || fill.isNegativeFee;
coverage_0x3208e528(0xe7bf1e8d700f8744b9433911188d6e27bdeac714b2ec4eb16901e08c631605b9); /* line */ 
        coverage_0x3208e528(0x7d38814d65534e6af4f184f34f1c078b474b8be8ba0a57bbcb82f2fc6c96a592); /* statement */ 
Require.that(
            validFee,
            FILE,
            "Fill invalid fee"
        );

        // verify triggerPrice
coverage_0x3208e528(0x029aa12a244ae56d32d6feafdcd094f64a6ceed1607b09afe06ffe09ec8a586f); /* line */ 
        coverage_0x3208e528(0xdc3425e79a8d4f0547a2ee6400f8b086f9a1b76053c578de07a70326f0dbdfc0); /* statement */ 
if (orderInfo.order.triggerPrice > 0) {coverage_0x3208e528(0xeee6b2a850ce6823f1df3bdac841b7a44333cf9b18ba944b29615f832ec2f246); /* branch */ 

coverage_0x3208e528(0xf4efc2ab244363947cd28394171cab2e13eea032649e82165d0fa495c6f68ff9); /* line */ 
            coverage_0x3208e528(0xf05bedadac27ef3eaa1b04172ff614523c5b03b9ac804b3bb1d416d7991f63e7); /* statement */ 
uint256 currentPrice = getCurrentPrice(
                orderInfo.order.baseMarket,
                orderInfo.order.quoteMarket
            );
coverage_0x3208e528(0x854692258715f0e8232e7f9faa1730c05ed9c2da8ff893ee0a928388985d5f14); /* line */ 
            coverage_0x3208e528(0x638826ec196bded88d1f27d21ee1f3a84b5841bac69c72ba6a443e96f9b3f5ab); /* statement */ 
Require.that(
                isBuy(orderInfo.order)
                    ? currentPrice >= orderInfo.order.triggerPrice
                    : currentPrice <= orderInfo.order.triggerPrice,
                FILE,
                "Order triggerPrice not triggered",
                currentPrice
            );
        }else { coverage_0x3208e528(0x1361afdf5551c5c86b4be60be4b64f66d60fd19985e658f7c98eb626345aa64c); /* branch */ 
}

        // verify expriy
coverage_0x3208e528(0xe57be244d4d54a3856cf68e94ff0e8fd3b5a54798ef1e35c514efc8bdd5c11e9); /* line */ 
        coverage_0x3208e528(0xa8e6c0cb15cd4f3b6be3a993262e8f12f82e434d4c6c5c31abe6bc55065451b1); /* statement */ 
Require.that(
            orderInfo.order.expiration == 0 || orderInfo.order.expiration >= block.timestamp,
            FILE,
            "Order expired",
            orderInfo.orderHash
        );

        // verify maker
coverage_0x3208e528(0x2f7a1f03cd7a7e7aca7e3f67a5e6234b9924bf17dd8aedbceaf4ad3fac0c4d8c); /* line */ 
        coverage_0x3208e528(0x41974ca3e695cf516e3d2690544e95fa59e397f10fc4a7956884d8dcf7df253b); /* statement */ 
Require.that(
            makerAccount.owner == orderInfo.order.makerAccountOwner &&
            makerAccount.number == orderInfo.order.makerAccountNumber,
            FILE,
            "Order maker account mismatch",
            orderInfo.orderHash
        );

        // verify taker
coverage_0x3208e528(0x237cdbb0e06e9a749929051ac92aa204eabfd54d7f65479e3bdb9fbbdf14a14e); /* line */ 
        coverage_0x3208e528(0x9530c6549305976d86d6eda409bb88cbebbd5c97b9ff38bbc96f00187d59992d); /* statement */ 
Require.that(
            takerAccount.owner == g_taker,
            FILE,
            "Order taker mismatch",
            orderInfo.orderHash
        );

        // verify markets
coverage_0x3208e528(0x7993c1d36f6b6a9681b900cff68cac679ff83fccf34171927feca9666ae9f420); /* line */ 
        coverage_0x3208e528(0x37ade00e07f7b975730d68c3e3dda7f1ec03c120f425d0dbec28698b5524ebd9); /* statement */ 
Require.that(
            (
                orderInfo.order.baseMarket == outputMarketId &&
                orderInfo.order.quoteMarket == inputMarketId
            ) || (
                orderInfo.order.quoteMarket == outputMarketId &&
                orderInfo.order.baseMarket == inputMarketId
            ),
            FILE,
            "Market mismatch",
            orderInfo.orderHash
        );

        // verify inputWei is non-zero
coverage_0x3208e528(0x7ec5e502ddb76d8d250a21e0c6c6ebe27f96d722e9fcd46330e108855d87bec0); /* line */ 
        coverage_0x3208e528(0xe81d5df7c3de04eae257cdbefca5b0f88197a169ee8804db038ff1ee95cdbccd); /* statement */ 
Require.that(
            !inputWei.isZero(),
            FILE,
            "InputWei is zero",
            orderInfo.orderHash
        );

        // verify inputWei is positive if-and-only-if:
        // 1) inputMarket is the baseMarket and the order is a buy order
        // 2) inputMarket is the quoteMarket and the order is a sell order
coverage_0x3208e528(0x91ca129416dc3f51a9ab7b79493c9cea81e051e4d1e6501160b53877551e8d08); /* line */ 
        coverage_0x3208e528(0x790df705bbdd35093662ecd446b488f3f66fbfdfd5f0e2214bcbb9ed1b5c1831); /* statement */ 
Require.that(
            inputWei.sign ==
                ((orderInfo.order.baseMarket == inputMarketId) == isBuy(orderInfo.order)),
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
    {coverage_0x3208e528(0x99e57e94e3bc7b1a6b23092c9865dea9d0257dc5a16dd9299896b11d91850c14); /* function */ 

        // verify that the balance of inputMarketId is not increased
coverage_0x3208e528(0x20d366bd485ffe2e462d251996f6a830438a0a858a5da3d9cf067e342f35d71e); /* line */ 
        coverage_0x3208e528(0xab7979dbeb3e50734398e052d880f061c8cac71b35da4a04a6697d59fd2bd059); /* statement */ 
Require.that(
            newInputPar.isZero()
            || (newInputPar.value <= oldInputPar.value && newInputPar.sign == oldInputPar.sign),
            FILE,
            "inputMarket not decreased"
        );

        // verify that the balance of outputMarketId is not increased
coverage_0x3208e528(0xc5e0285951ac3c856e1ba4b70a1b9cd409f992a850183cc0865fcf81e4af8c72); /* line */ 
        coverage_0x3208e528(0xdec1376b28ccfdb57057e05168535b7956a8afcf3888049e58050c1bf358b19e); /* statement */ 
Types.Wei memory oldOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);
coverage_0x3208e528(0x29d33bb2ee74bc992e84a8b4117c3cbe5595da7af63baef1143dd4c17a99497c); /* line */ 
        coverage_0x3208e528(0x648d0f2573a59be791c3325bd91b16be5f34e9319ca25141eea896f32b3e3396); /* statement */ 
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
    {coverage_0x3208e528(0x57b4a16f2b54d5b52f63e5ffec94244422ad068f0b1e4b53814b1b87fa032023); /* function */ 

coverage_0x3208e528(0x52c36be98b96d7cf42eed10877b7fe162f79c28d3ad92b1c60c0af660abb1f5b); /* line */ 
        coverage_0x3208e528(0x7737a77ffd6eadb2fa7afd35754f1c26426dd2243b54407a8be77919cf6b23a2); /* statement */ 
uint256 fee = orderInfo.fill.price.getPartial(orderInfo.fill.fee, PRICE_BASE);
coverage_0x3208e528(0x27eb7ff5e12b7e59d55bae69abffebdb3d1d4344ca75b1962e66114d93782762); /* line */ 
        coverage_0x3208e528(0x19b398732d2c3bbc7356d0556d3886510923d6a544afae77167463672be1ee4c); /* statement */ 
uint256 adjustedPrice = (isBuy(orderInfo.order) == orderInfo.fill.isNegativeFee)
            ? orderInfo.fill.price.sub(fee)
            : orderInfo.fill.price.add(fee);

coverage_0x3208e528(0x4d77febf31484e792875478e84f6337cddb4ad5cb64301289533d8b00360eee0); /* line */ 
        coverage_0x3208e528(0x12eb0335211f4bc9a429b2d98c4ab46015c324050c0ec57811af59972a14e996); /* statement */ 
uint256 outputAmount;
coverage_0x3208e528(0x506944f6f2be633229d125957a30d3a45647a65965b1165201a47bc153fb0a96); /* line */ 
        coverage_0x3208e528(0xf76e5593774637853dbfdb9da5c6c573ec3ca9c0cb65f9d46fbd28c58ef27f1f); /* statement */ 
uint256 fillAmount;
coverage_0x3208e528(0xb55c05c02243f216fe13b37314460d318171b3f9ef779ed6bb7731b21b6888a4); /* line */ 
        coverage_0x3208e528(0xfa8722eb6d21cc6ced6be54e1388c7ef330ab854a58afc331dc22cecf5223df7); /* statement */ 
if (orderInfo.order.quoteMarket == inputMarketId) {coverage_0x3208e528(0x242013cff949ff190c55dbb5a8e5ee76a29bc2fe254c0987cd5679df644d0687); /* branch */ 

coverage_0x3208e528(0x4879b782f2888bc36f4b775016b6f51ac8bd29623e57385e75ea1b01095a7a91); /* line */ 
            coverage_0x3208e528(0xf076777ae0fc9cd9fa1404d4bcf84ea5a8d764a446d0627b2958839ae1a445a7); /* statement */ 
outputAmount = inputWei.value.getPartial(PRICE_BASE, adjustedPrice);
coverage_0x3208e528(0x0e310cb783e5761c6e87276d3826ba04b51c426985da540c3360c6bd35f14011); /* line */ 
            coverage_0x3208e528(0x11d06dde180154e9113c5c460340fba1d48b010afd26dd0aeabace073dcf3ff5); /* statement */ 
fillAmount = outputAmount;
        } else {coverage_0x3208e528(0x494ed778d554129b9f9737fcba37a257ac6a72c9c8828f8e2a8d26d86a92425b); /* branch */ 

coverage_0x3208e528(0x9c6be5b0c0b45ed673a2f7081601f5ec91b3c88977f28e122e7baf1b08268d05); /* line */ 
            coverage_0x3208e528(0x3053eb6a4cee6690a68342e2d958f45d63f0f5ca15f38efc34622ef599c41cac); /* assertPre */ 
coverage_0x3208e528(0xf11851e35a782f3ccb6320ee623fcb4c515f896bb9c9118e4bce459e3463b4f3); /* statement */ 
assert(orderInfo.order.quoteMarket == outputMarketId);coverage_0x3208e528(0xd1b73ecf36ca179f4c25d8c67585b105ee758b5a8bd9eeb073a68ae8f4551d4b); /* assertPost */ 

coverage_0x3208e528(0x0b8e08ad4c895599ee3f10b62a74adfc17f9d7711d6cddb03720adddf48b5402); /* line */ 
            coverage_0x3208e528(0xb1bf5004372af89e53bb9d2da20eca9b053725c6352a6bf4401e08cc563dcea0); /* statement */ 
outputAmount = inputWei.value.getPartial(adjustedPrice, PRICE_BASE);
coverage_0x3208e528(0x42501830bf7a89abf89f62b106c676eebc98a4730b53f82a03fcc9dff603b0f6); /* line */ 
            coverage_0x3208e528(0xee2b535ed45dbcc42f723dde95d3cfed8e49d63fa17a07cbce878524437036b4); /* statement */ 
fillAmount = inputWei.value;
        }

coverage_0x3208e528(0x299c86899b709fcd9903690a0cfa2e576038b37316fb567f1f3b477c5d9f8b6f); /* line */ 
        coverage_0x3208e528(0x9c8afbfd3b4b9841782ef4988d829900eeeafda8ec9d069206448b103ebac830); /* statement */ 
updateFilledAmount(orderInfo, fillAmount);

coverage_0x3208e528(0x2651d2738697044d5a9431e13f5c9956759634273c509b7f1051750caebc383e); /* line */ 
        coverage_0x3208e528(0xcff71584d783b7daf4f60709ab27612eb2b4146625052534de7dd7af96db0f31); /* statement */ 
return Types.AssetAmount({
            sign: !inputWei.sign,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: outputAmount
        });
    }

    /**
     * Increases the stored filled amount of the order by fillAmount.
     * Returns the new total filled amount.
     */
    function updateFilledAmount(
        OrderInfo memory orderInfo,
        uint256 fillAmount
    )
        private
    {coverage_0x3208e528(0x0a749487cb649b66ba41404b83d4a27b323db6a4b58fc3c0342657732fd7194d); /* function */ 

coverage_0x3208e528(0x764104bcd8af052590d99c87f4982208a1e583c9e7ba3c9db3a9ee243d95a58f); /* line */ 
        coverage_0x3208e528(0x23b9602c5c93717ec8b20354e1bf796842d2ba15a760981f28bf983ccd35bf50); /* statement */ 
uint256 oldFilledAmount = g_filledAmount[orderInfo.orderHash];
coverage_0x3208e528(0x28cf840b376fcdf2637e830eb43b6d7d99c08c16da7ed6978a16142579f24e28); /* line */ 
        coverage_0x3208e528(0xb4a4f65002a7b5e1fdd59ddbe5c06287f4c1872f0425a476ce544959048228c8); /* statement */ 
uint256 totalFilledAmount = oldFilledAmount.add(fillAmount);
coverage_0x3208e528(0xcf9d281d0032b6b4ddd61848d7fb6fff8288f2831e7090c9966c563a30a47c68); /* line */ 
        coverage_0x3208e528(0xc3b0a18e00f59f5e9d70970540fd04bf5aecdd4b36d42040107bd0026d8f634c); /* statement */ 
Require.that(
            totalFilledAmount <= orderInfo.order.amount,
            FILE,
            "Cannot overfill order",
            orderInfo.orderHash,
            oldFilledAmount,
            fillAmount
        );

coverage_0x3208e528(0xe367570d49f17893fef6dfc7df631a4ff97f289544b4a59f2563e793cb603e4b); /* line */ 
        coverage_0x3208e528(0xb7f5c33effa5bc9c13107320b8245b35157325e7520cac1734befaf8ffb29ee2); /* statement */ 
g_filledAmount[orderInfo.orderHash] = totalFilledAmount;

coverage_0x3208e528(0xb7c11d7e53edfe25aa1e514b3152313e9d124a4a68ba13659cd47fa5ddbec127); /* line */ 
        coverage_0x3208e528(0xf0cfb3c22af0a5f4ea7945bb889e6a947ffd4d8d4c0d7a6ad3e87e0b30099cb5); /* statement */ 
emit LogCanonicalOrderFilled(
            orderInfo.orderHash,
            orderInfo.order.makerAccountOwner,
            fillAmount,
            orderInfo.order.triggerPrice,
            orderInfo.order.flags,
            orderInfo.fill
        );
    }

    /**
     * Returns the current price of baseMarket divided by the current price of quoteMarket. This
     * value is multiplied by 10^18.
     */
    function getCurrentPrice(
        uint256 baseMarket,
        uint256 quoteMarket
    )
        private
        view
        returns (uint256)
    {coverage_0x3208e528(0x4a083721c285fa4aa3d7db48fff6328e4840cb5540eab0182437fa835ccb6d47); /* function */ 

coverage_0x3208e528(0xb55b742a7f5d081c22377d9e7788832c57f627075ab1a766e5b81ba8dd04085d); /* line */ 
        coverage_0x3208e528(0xac42ea9d2bbb246622845e4cdaf0254daf63737a6f085fd59a1ebeec4b4b9495); /* statement */ 
Monetary.Price memory basePrice = SOLO_MARGIN.getMarketPrice(baseMarket);
coverage_0x3208e528(0x2098bc2c38da6dd67f595e5fa905f9b37e80ba8555758370edd0900e49813f8c); /* line */ 
        coverage_0x3208e528(0x462aaec2bdf8f7467ba1cd70f2caf5ca0ce776b6fd2e72823ca01b40a58242d8); /* statement */ 
Monetary.Price memory quotePrice = SOLO_MARGIN.getMarketPrice(quoteMarket);
coverage_0x3208e528(0x41ca196d30fb37b1930484dd6f6f065107ada3eac7677e1fc5aca17c97f4f4a2); /* line */ 
        coverage_0x3208e528(0x3a46fda740051bca69d62866be9cc4331605170683dec395c65cef706083a135); /* statement */ 
return basePrice.value.mul(PRICE_BASE).div(quotePrice.value);
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
    {coverage_0x3208e528(0x1f8c086f299b7bd1c5e251846ab0d0cd3b006eab407f07f40bcdad534c0540c7); /* function */ 

        // compute the overall signed struct hash
        /* solium-disable-next-line indentation */
coverage_0x3208e528(0x096d5664abb47dc732ac9b4ec77c996767f91e814d228446d43f999b4e5a1f15); /* line */ 
        coverage_0x3208e528(0xe62926617228d3a7def8ac5bd55846ac6452b8929853bc2232d5d660bd78f321); /* statement */ 
bytes32 structHash = keccak256(abi.encode(
            EIP712_ORDER_STRUCT_SCHEMA_HASH,
            order
        ));

        // compute eip712 compliant hash
        /* solium-disable-next-line indentation */
coverage_0x3208e528(0xc5e6eabaa8d533d655b61151edab8e42b3a9790045b8d96c2c9e2783eb33c99e); /* line */ 
        coverage_0x3208e528(0x844b6c3ac1b748a0083bf9d6a7847cf6a95b248a04b2db8371409b91c9f740aa); /* statement */ 
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
    {coverage_0x3208e528(0x20a9c54d75e3ae70eda122802f75272ebb7a98ba882eb0fc4ecb4c9d6c3821e9); /* function */ 

coverage_0x3208e528(0x08fcf31cae650bcaa4f918d5939b59cc4669f819db36ef5f7f7a2df51912087e); /* line */ 
        coverage_0x3208e528(0x13f4bf1507c76896893f50aedaebae202d9a14c4ec8ce47496528f6439c6f324); /* statement */ 
Require.that(
            data.length == NUM_ORDER_AND_FILL_BYTES + NUM_SIGNATURE_BYTES,
            FILE,
            "Cannot parse signature from data"
        );

coverage_0x3208e528(0x0507b74b3d6fa1be5d8633e71edb650626ab233fe69646b1f5eafe39b9f1f2f7); /* line */ 
        coverage_0x3208e528(0x87e37678099d8d126a9b24e57e5f25c403f65689959f1c951bcfcdb843b3d90f); /* statement */ 
bytes memory signature = new bytes(NUM_SIGNATURE_BYTES);

coverage_0x3208e528(0xc9a0887a7470bf2b681b7975bae166ef3cbd2d56c9150b7103cefa83f6386e8e); /* line */ 
        coverage_0x3208e528(0xfc872e92664dad8323b95e406a5da5287f7c9ac3fd44cd912fe78cab699716b5); /* statement */ 
uint256 sigOffset = NUM_ORDER_AND_FILL_BYTES;
        /* solium-disable-next-line security/no-inline-assembly */
coverage_0x3208e528(0x63ffd0b810b6692c85d12799ab9c9b567754784445b108ac60817e31984b952a); /* line */ 
        assembly {
            let sigStart := add(data, sigOffset)
            mstore(add(signature, 0x020), mload(add(sigStart, 0x20)))
            mstore(add(signature, 0x040), mload(add(sigStart, 0x40)))
            mstore(add(signature, 0x042), mload(add(sigStart, 0x42)))
        }

coverage_0x3208e528(0xc88a45764ce6bddb1492e7a964a9d1d084942b2de3c07724afec747f0a54f5a4); /* line */ 
        coverage_0x3208e528(0x446fbf08aaa53e961af28501af8fcff94682c516661767fb3b798928d61529b2); /* statement */ 
return signature;
    }

    /**
     * Returns true if the order is a buy order.
     */
    function isBuy(
        Order memory order
    )
        private
        pure
        returns (bool)
    {coverage_0x3208e528(0x344c46dda1ae39e6b4f82910aafef594957b5050da1878c10204f419a54673f2); /* function */ 

coverage_0x3208e528(0x0f1d6649ecc0e031291b62ba6d921acbc15c9bf3c7ea2f62f2a71d2bda6d9c73); /* line */ 
        coverage_0x3208e528(0x063ebb8f1a8df383559e2a214b8868e5ee3ee596b9c81e96107252dca6d8edd8); /* statement */ 
return (order.flags & IS_BUY_FLAG) != bytes32(0);
    }

    /**
     * Returns true if the order is a decrease-only order.
     */
    function isDecreaseOnly(
        Order memory order
    )
        private
        pure
        returns (bool)
    {coverage_0x3208e528(0x004486fd8fb20040811f9111d05db15904b054b4d0cb9dbd84f9e0094ba8a5bb); /* function */ 

coverage_0x3208e528(0xdf71397b56684b9fc637788e818a747f4f6f93dc01c967cd04c6f0838807690f); /* line */ 
        coverage_0x3208e528(0xb1ad7f5d69c1f7a02b464ec26de8489bba7fe85ee9460fe1c834a887170a6dc5); /* statement */ 
return (order.flags & IS_DECREASE_ONLY_FLAG) != bytes32(0);
    }

    /**
     * Returns true if the order's limitFee is negative.
     */
    function isNegativeLimitFee(
        Order memory order
    )
        private
        pure
        returns (bool)
    {coverage_0x3208e528(0x2e0c45a27ec93c0ab5287d9eeeb9763c06806cce28a83822a7f804dc74f6968f); /* function */ 

coverage_0x3208e528(0xe06c913761c5b959599eab4a52fa7e2d560387c7de10f575956c20713ad257d0); /* line */ 
        coverage_0x3208e528(0xee910e236ccc9ddc0a60c2adbe09ca68a79b2df863948a5e418c18ea586e6587); /* statement */ 
return (order.flags & IS_NEGATIVE_FEE_FLAG) != bytes32(0);
    }
}
