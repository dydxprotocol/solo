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
 * @title ExpiryV2
 * @author dYdX
 *
 * Expiry contract that also allows approved senders to set expiry to be 28 days in the future.
 */
contract ExpiryV2 is
    Ownable,
    OnlySolo,
    ICallee,
    IAutoTrader
{
function coverage_0xea6679bd(bytes32 c__0xea6679bd) public pure {}

    using Math for uint256;
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Types for Types.Par;
    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "ExpiryV2";

    // ============ Enums ============

    enum CallFunctionType {
        SetExpiry,
        SetApproval
    }

    // ============ Structs ============

    struct SetExpiryArg {
        Account.Info account;
        uint256 marketId;
        uint32 timeDelta;
        bool forceUpdate;
    }

    struct SetApprovalArg {
        address sender;
        uint32 minTimeDelta;
    }

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

    event LogSenderApproved(
        address approver,
        address sender,
        uint32 minTimeDelta
    );

    // ============ Storage ============

    // owner => number => market => time
    mapping (address => mapping (uint256 => mapping (uint256 => uint32))) g_expiries;

    // owner => sender => minimum time delta
    mapping (address => mapping (address => uint32)) public g_approvedSender;

    // time over which the liquidation ratio goes from zero to maximum
    uint256 public g_expiryRampTime;

    // ============ Constructor ============

    constructor (
        address soloMargin,
        uint256 expiryRampTime
    )
        public
        OnlySolo(soloMargin)
    {coverage_0xea6679bd(0xb2e5ff30d164e07e4189b61277db6eedece22f2cfa1d1c1914397e2aaece9950); /* function */ 

coverage_0xea6679bd(0x381a96a3838d48e01c9d730627c5059df50a5cea520660283781c469a3b7f7ac); /* line */ 
        coverage_0xea6679bd(0x504c132df7f1efe8c2c47d4252ffa7026f409877861b4ca4276c241ca58956a8); /* statement */ 
g_expiryRampTime = expiryRampTime;
    }

    // ============ Admin Functions ============

    function ownerSetExpiryRampTime(
        uint256 newExpiryRampTime
    )
        external
        onlyOwner
    {coverage_0xea6679bd(0xc3e050030fc2522051f9b16c69cb294edf8777b0fdcf0fc3337149ebde334181); /* function */ 

coverage_0xea6679bd(0x9651267341523229238820ef3186ad1c80ada1bc0254e53f69e785416fab48b9); /* line */ 
        coverage_0xea6679bd(0xa7032628ad4cd4ad529adc36ebc8369b72d58f70e3987a834324a1612f6d77ab); /* statement */ 
emit LogExpiryRampTimeSet(newExpiryRampTime);
coverage_0xea6679bd(0x04601a88a11233e548fa6a998454599944ec95dc0bb7b087b4dec801c3b1d2bf); /* line */ 
        coverage_0xea6679bd(0x013a8c07e25f58fd9faa7fd1a6772c467ab38d26dd1287e929e7d3b6e23e1222); /* statement */ 
g_expiryRampTime = newExpiryRampTime;
    }

    // ============ Approval Functions ============

    function approveSender(
        address sender,
        uint32 minTimeDelta
    )
        external
    {coverage_0xea6679bd(0xa8a8e0bceb5c13886e7f27755b65f15796f9c29d5810ea9503d017c412586acc); /* function */ 

coverage_0xea6679bd(0xeb8b49e0a2f89c7efe9fd714f0252d0e4caeff0e8a31eb8518848bdce55f02fa); /* line */ 
        coverage_0xea6679bd(0x521e28d1d30c17865a811f9012ec099c8e860bbe5a46b59f20294cd738345c1f); /* statement */ 
setApproval(msg.sender, sender, minTimeDelta);
    }

    // ============ Only-Solo Functions ============

    function callFunction(
        address /* sender */,
        Account.Info memory account,
        bytes memory data
    )
        public
        onlySolo(msg.sender)
    {coverage_0xea6679bd(0x2f3df429816676e3729ec94eb7388866a64664b0fccb49bd7e8bd582bdf102bd); /* function */ 

coverage_0xea6679bd(0x67fc1522e94c3ad6093e5c32d47951e186c504d56c5c4ad52b15b69cd60115d0); /* line */ 
        coverage_0xea6679bd(0x8c0bc38d442e83f0b91bd5549fae36c3ef222d44b6568616e1166426b96380bd); /* statement */ 
CallFunctionType callType = abi.decode(data, (CallFunctionType));
coverage_0xea6679bd(0xe4b52b0327cdec6ab1304eeff5830df1e2b1a0673ce486d220177fec364b32e8); /* line */ 
        coverage_0xea6679bd(0x7b0a500bb67f89fa2c8b7ea13ef0f80656287f77e2d2c0beda954e053627030d); /* statement */ 
if (callType == CallFunctionType.SetExpiry) {coverage_0xea6679bd(0x4f3132cb543341fd2431565833faeecf565e18188f978f89d6171cf91b15e215); /* branch */ 

coverage_0xea6679bd(0x5caa445e5a680a25009df4c7a65238396951fbef2504b7568fb3766d005a4b4e); /* line */ 
            coverage_0xea6679bd(0x558e50d01785e510886f788e9e1204a09f9c2cc2a1020be17cd975f384f56378); /* statement */ 
callFunctionSetExpiry(account.owner, data);
        } else {coverage_0xea6679bd(0xa1d44c45db946cc5d3483098050d9b51e2e025b42b7164133912cb87ff0afa44); /* branch */ 

coverage_0xea6679bd(0xc26749f4f2daee33e8df466ad4bdfb1e08048452b6d523cbfd0a78b53f2a6b2c); /* line */ 
            coverage_0xea6679bd(0xc63701d81f311311ba453edf7927229bd13bb92b5d654b92a0ffaa011fcbcd84); /* statement */ 
callFunctionSetApproval(account.owner, data);
        }
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
    {coverage_0xea6679bd(0x06c86a13856bd0cc420952ba28bc791cfbf89432453bb77021eaec403873d921); /* function */ 

        // return zero if input amount is zero
coverage_0xea6679bd(0x42317d6c1f8bec25dbf68dacc2e366221400a77d254f73cd91a8a9ed2f6dc1bd); /* line */ 
        coverage_0xea6679bd(0x2341f52596e0c4a1b5d24372886d210e034dca54904c0b278e50cb929800938f); /* statement */ 
if (inputWei.isZero()) {coverage_0xea6679bd(0xc01b8f6745e2a7995cee13d20f5cc8aa53b53153b575b77d4861af4d8493f4ae); /* branch */ 

coverage_0xea6679bd(0x0e45fbff77d03f7f3493a2c2b954bb525ae342f74d745c9c79282308ee6c8988); /* line */ 
            coverage_0xea6679bd(0x04487d89e80a1831075fc0a0e556526fbab5cd90e5cda300583b1c16a692df48); /* statement */ 
return Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: 0
            });
        }else { coverage_0xea6679bd(0xc281cc1d449729a5843def560a3bb44c1f51e6fb501d9cc14696d7e4fc62390c); /* branch */ 
}

coverage_0xea6679bd(0x490679f0198bb8a9adb37a43871ae0241a89f06c884ecc19ecf07fe8e5181c1e); /* line */ 
        coverage_0xea6679bd(0x688b6393f8c88c6660155c3fe48fc61aecbfe3aee1cc68c41ff63a6ce1c0d5ca); /* statement */ 
(uint256 owedMarketId, uint32 maxExpiry) = abi.decode(data, (uint256, uint32));

coverage_0xea6679bd(0xef87b36232f470819840ec2bd99eef802fb89b84b9758427a695996b7e21e18c); /* line */ 
        coverage_0xea6679bd(0x8ec8d389ba2ca0cca508a915743071ec214c9a4a5ef6545afce6295335569f6f); /* statement */ 
uint32 expiry = getExpiry(makerAccount, owedMarketId);

        // validate expiry
coverage_0xea6679bd(0xc3263dbbe28491655507e1901697df831721a0918d99ecd5c8240bd77b0f9ca9); /* line */ 
        coverage_0xea6679bd(0x3b261a933e47b09e0ade70db3a55274917cd84f327481ed9db3cd98c940af5d4); /* statement */ 
Require.that(
            expiry != 0,
            FILE,
            "Expiry not set",
            makerAccount.owner,
            makerAccount.number,
            owedMarketId
        );
coverage_0xea6679bd(0x3feb7beed661a6cb67874903b3942903840ad1428434694b57b8ae9d53e1bc49); /* line */ 
        coverage_0xea6679bd(0xaf877a3be3f06fe5a3c35f4f6e1e7c4120054dcb504ba508d7655ade9f9cacd2); /* statement */ 
Require.that(
            expiry <= Time.currentTime(),
            FILE,
            "Borrow not yet expired",
            expiry
        );
coverage_0xea6679bd(0x451f5c7997965ee9fdb5869eb634a5f67d7ba13bcb6135d28d31cf34ac389618); /* line */ 
        coverage_0xea6679bd(0x57a3be1ad113145894682341e9cf088e1b6a71e2ba01a01aac0b401b5a1d1b7e); /* statement */ 
Require.that(
            expiry <= maxExpiry,
            FILE,
            "Expiry past maxExpiry",
            expiry
        );

coverage_0xea6679bd(0xa1d256e937a2461390e1389717c65d6171d00ba49977ccaf1517678bf01d9cea); /* line */ 
        coverage_0xea6679bd(0xaf67adb3b21b85a08e3133cdd5ffed27465730a056b4b5839250ec2e18f5a9c2); /* statement */ 
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
    {coverage_0xea6679bd(0x240d240b0fc66eef38cdd9fe9788ecba1bde3240548c7aca569979edd371f413); /* function */ 

coverage_0xea6679bd(0x1afdfa5320e863fb118afa989b5b45cce3fcc7085bcf0bfcd9ab67c060786e3d); /* line */ 
        coverage_0xea6679bd(0x519b676a2436836b4b4e682a3d4d57c108b7afc80eb040a50e87fdd77094d042); /* statement */ 
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
    {coverage_0xea6679bd(0xcb9153b6f51b12f872d7c15e198565f243920a990e31ed54f6244ae5e0d16c1b); /* function */ 

coverage_0xea6679bd(0x7c6c2529b35933a5d6d78cd7d13d22bfd969d798092c2ffa8652ae80c73acd7a); /* line */ 
        coverage_0xea6679bd(0xbb9c19a5d4c69d6d96c6d2895481466732a067529017ba57175daba40db04561); /* statement */ 
Decimal.D256 memory spread = SOLO_MARGIN.getLiquidationSpreadForPair(
            heldMarketId,
            owedMarketId
        );

coverage_0xea6679bd(0x2bba207112613e3e5b96c8059f7c1a2cd558cfe14ab2b5910929defbc3fac18c); /* line */ 
        coverage_0xea6679bd(0x6ff75241ac351b4a035cab3408944ad2139557b7d333f8266086270ffdda82ac); /* statement */ 
uint256 expiryAge = Time.currentTime().sub(expiry);

coverage_0xea6679bd(0xb085b3f9c6e940f1bbb4f9ee5db2b1b7a58447ec6e907aefb97e221d82a79331); /* line */ 
        coverage_0xea6679bd(0x2cb0d5d7891b32afda28ee313cc96c74b6957e642ac4739a69055b08f1de3603); /* statement */ 
if (expiryAge < g_expiryRampTime) {coverage_0xea6679bd(0x8f011d1eb20e4e6b431517984366aabb51e6c0f3ae8c7cde460af8dd1837e60d); /* branch */ 

coverage_0xea6679bd(0x4d311057ed26ff1a116a9f7913113f7ee5c9debdeb4afd297fb88a804205c540); /* line */ 
            coverage_0xea6679bd(0x75a6b7dc4eda087af57921ee19fff6f663cfdba3062f6d49a981cd4bdf508910); /* statement */ 
spread.value = Math.getPartial(spread.value, expiryAge, g_expiryRampTime);
        }else { coverage_0xea6679bd(0x3059389d77c3d151990fff950b400738a0859324291daa1eab3961ffd368d246); /* branch */ 
}

coverage_0xea6679bd(0x1c6980642d16652a4fac66114ca507744e18f7a0c2b37f2ce17c16787aeb78dd); /* line */ 
        coverage_0xea6679bd(0x5dc6e79d7abf4a5d71af90e29f59037d545a5aed55844c744e888dde0655fef7); /* statement */ 
Monetary.Price memory heldPrice = SOLO_MARGIN.getMarketPrice(heldMarketId);
coverage_0xea6679bd(0x85cb450e3f3d5822c062e76b701e11dab53946a5e1b3c82eb957ed4c531ceb14); /* line */ 
        coverage_0xea6679bd(0xdd20f0c80db06deeabb12b90ec77fee30fc9340392ac20d05f13939128ccdae3); /* statement */ 
Monetary.Price memory owedPrice = SOLO_MARGIN.getMarketPrice(owedMarketId);
coverage_0xea6679bd(0x54038ed7d37b83e84b0fc98def490eedc02c1b579e680d041a119e151a67046a); /* line */ 
        coverage_0xea6679bd(0xe1d474d7449e9af34529c38099aca1f1e9e97739ee59b213815a99789dc75e36); /* statement */ 
owedPrice.value = owedPrice.value.add(Decimal.mul(owedPrice.value, spread));

coverage_0xea6679bd(0x6751296e47397fcff317ee1ac81c02c6a7b8a2b8aa20e79aad5e5e62a40de9ed); /* line */ 
        coverage_0xea6679bd(0xdc052fc847b880ad15c5778fe4cc0478bfa46aef7870dd5a5964057fde3e967c); /* statement */ 
return (heldPrice, owedPrice);
    }

    // ============ Private Functions ============

    function callFunctionSetExpiry(
        address sender,
        bytes memory data
    )
        private
    {coverage_0xea6679bd(0xbdc0e1f6c1d153e1f5342a80fe6033349806688130a03d5521429ab1e8b085e7); /* function */ 

coverage_0xea6679bd(0x396ad06236304c6a7c69cde7426cff3865467bea2580adb34ce872a766aca8f2); /* line */ 
        coverage_0xea6679bd(0x12e5c657b92f11fc9d4468e67b4ef26ff5f4d61475421558a56d75f6eaf06921); /* statement */ 
(
            CallFunctionType callType,
            SetExpiryArg[] memory expiries
        ) = abi.decode(data, (CallFunctionType, SetExpiryArg[]));

coverage_0xea6679bd(0xb39b3f41719113853d0c46ccb6eea3ed863fa955058b504cb99da7ccb5df6fa6); /* line */ 
        coverage_0xea6679bd(0x6c3b90a9f19ac01c6395486a88c7656c65fbab07eee0b89a13f8c58150f5ef96); /* assertPre */ 
coverage_0xea6679bd(0x4308b752b0bb895e463170816ebc7ecb019976f19606aa86c098356339219e64); /* statement */ 
assert(callType == CallFunctionType.SetExpiry);coverage_0xea6679bd(0x12d91e7e72d92e76bf79d5c91c1329f08f6f9d2fccd7f26abb66c5887a3370d8); /* assertPost */ 


coverage_0xea6679bd(0xb6a414ef9d5c41990bf56fb676f3252f30a6df857ffc9240b0156f40012875ad); /* line */ 
        coverage_0xea6679bd(0xdc8b1458aa3553e6125a58378509bbff2d5f8bc14b48cc31f1ab784f4cd268b3); /* statement */ 
for (uint256 i = 0; i < expiries.length; i++) {
coverage_0xea6679bd(0xd3c0e25070bcf1a9217830e6e420b52523ace5ea8521f739f9f4b91f16f6f0fa); /* line */ 
            coverage_0xea6679bd(0x0f91d6878aba396a219bbf392875a3a4bda19718fd1cfc92268d8a68f21a9ae5); /* statement */ 
SetExpiryArg memory exp = expiries[i];
coverage_0xea6679bd(0xb84060c60f02433d625f6d3f8b043b71997116abeadfc4dc883c9d56fda052b2); /* line */ 
            coverage_0xea6679bd(0x956bd97930e347534a6b120efc3607d4e06deb613904083acc82395b2230cf20); /* statement */ 
if (exp.account.owner != sender) {coverage_0xea6679bd(0xc2a83862bd872406a59a671bbb4db0ea2d6e35d800a9e6c6a3b82e966a03e671); /* branch */ 

                // don't do anything if sender is not approved for this action
coverage_0xea6679bd(0x403f01ab59241e369c2dfdbfd1e5745497a6085616f8177e7a9175a2942d41d3); /* line */ 
                coverage_0xea6679bd(0xef1aa07468e98dab25e18b9058effd65b5d30444b703da7efb9a479fa27357bd); /* statement */ 
uint32 minApprovedTimeDelta = g_approvedSender[exp.account.owner][sender];
coverage_0xea6679bd(0x9051d22ddca4298277d927aa5f39885abc1eebfb583b16a78558fb492e73238d); /* line */ 
                coverage_0xea6679bd(0xcab76d454895bb7c17b1da1ba69d998eefab81616fab9fa4fcc237bd0a808a79); /* statement */ 
if (minApprovedTimeDelta == 0 || exp.timeDelta < minApprovedTimeDelta) {coverage_0xea6679bd(0x446d1244ec08ee14c1ec13bf9511d7b64f31ee8b0ada73e7d023327bbb060fc2); /* branch */ 

coverage_0xea6679bd(0xd6fc6a5d1eed9e4f3ff992786417dbb5e13bbff892c0193306af544a6af2f0eb); /* line */ 
                    continue;
                }else { coverage_0xea6679bd(0x862c3f895da06add2a72ad27a0283aea4a9d34f8458fd7ee105f8defe06c828f); /* branch */ 
}
            }else { coverage_0xea6679bd(0x4349054649b118efd79f67df48f65dafa499a7f81b53b16bd8928f5a142d310b); /* branch */ 
}

            // if timeDelta is zero, interpret it as unset expiry
coverage_0xea6679bd(0x9daaae906cfc754818269542cadc486c7cc70e8f4ae11247e4c67079094427fa); /* line */ 
            coverage_0xea6679bd(0xd0681e459a40edd918a8dd13600d8a877c1a2c2ea7bbf04681435f70aeb24131); /* statement */ 
if (
                exp.timeDelta != 0 &&
                SOLO_MARGIN.getAccountPar(exp.account, exp.marketId).isNegative()
            ) {coverage_0xea6679bd(0xaf9b89a33c4bef8207f5045f9efee2e2a2ee749015a81383c76ace62b1d1472e); /* branch */ 

                // only change non-zero values if forceUpdate is true
coverage_0xea6679bd(0x9a435c4d99c3c1fbae5fb3fadf71181c0e463832ae24c25f0e7417a8d8d16134); /* line */ 
                coverage_0xea6679bd(0xccf376f4ae7e980b506353664afed663efc8230cedbeada017f77c7a5334df16); /* statement */ 
if (exp.forceUpdate || getExpiry(exp.account, exp.marketId) == 0) {coverage_0xea6679bd(0xcec2a7db7e05106c13037db43d10638373203f8c4195fb7afda92beb7f8facc6); /* branch */ 

coverage_0xea6679bd(0xed0e231a171fbf41bf69657b2469cd5eb15ee1efdb325746ab606ee7e091a8cb); /* line */ 
                    coverage_0xea6679bd(0x8b9a5846484a3b956a6790eabf07e496023ef0f8e157a230067ccabd8d815d04); /* statement */ 
uint32 newExpiryTime = Time.currentTime().add(exp.timeDelta).to32();
coverage_0xea6679bd(0xd17b335ee9789ed9372de88693ddc36631a7e0ea845d2794afed67467002e798); /* line */ 
                    coverage_0xea6679bd(0x26bd76f7ec567c7bef78538526a0baf4277dd8ce1d4ee43f6bc92289ce61c5e1); /* statement */ 
setExpiry(exp.account, exp.marketId, newExpiryTime);
                }else { coverage_0xea6679bd(0x4ee653789b06c17b35ae67a3a096cd61d60fef6eb48bec1e8d2510006ff71ad4); /* branch */ 
}
            } else {coverage_0xea6679bd(0xeaddd04f5c0d2a02909931235ce3af2d04bf6bbe46b21492dc29d25b3091eca4); /* branch */ 

                // timeDelta is zero or account has non-negative balance
coverage_0xea6679bd(0xc311fe70f7fbaeff01bd1c026d6eb2e44cf658254bda238f1f6d7bb1950b5fcd); /* line */ 
                coverage_0xea6679bd(0xb1d61773eb56e889a28fbd14681b4166531cf34b297e8f0f8d5407752f9623d8); /* statement */ 
setExpiry(exp.account, exp.marketId, 0);
            }
        }
    }

    function callFunctionSetApproval(
        address sender,
        bytes memory data
    )
        private
    {coverage_0xea6679bd(0x515601487c51fcb51675299f607aa4e2c13a94cc0610fea83504e18d50ca4eb3); /* function */ 

coverage_0xea6679bd(0xd8d6123f653159c8a62bcad7b3569b7ad35a987705d28d2ae9a546870b2165ea); /* line */ 
        coverage_0xea6679bd(0x8d5a7813fc9c55fbbf7a7ab1e82bc77be01d22a8c9c09529441edfe3731431d2); /* statement */ 
(
            CallFunctionType callType,
            SetApprovalArg memory approvalArg
        ) = abi.decode(data, (CallFunctionType, SetApprovalArg));
coverage_0xea6679bd(0x73cc118f35f0b649fbe2339bf789d14b48b278797bf0ae1cd72977214f5bebc0); /* line */ 
        coverage_0xea6679bd(0x1de1728477b6cf1889b413f8ac078b34a5de79f02120d3b5f5ff5a555b95276d); /* assertPre */ 
coverage_0xea6679bd(0xa2225b22bea4e89e3342fa12982065388b16ba9e9f09d8a44e44d62053d6165e); /* statement */ 
assert(callType == CallFunctionType.SetApproval);coverage_0xea6679bd(0xe53a0219caa7c16db967ee7f6ed25f37903561f907bd9749f18febd243cdfe49); /* assertPost */ 

coverage_0xea6679bd(0x487251350984f1035f876878ab7b1c6b09791c12f3f0e444e12775e50b824b63); /* line */ 
        coverage_0xea6679bd(0x914993503e49571a04e8e50d523aa4c3291ec52bf74bcb41f9f6f114dc86cd52); /* statement */ 
setApproval(sender, approvalArg.sender, approvalArg.minTimeDelta);
    }

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
    {coverage_0xea6679bd(0xae7f9f5e5d9e98da773dc107ca037d52986097fba762b3b0e6bde47563f7e1e2); /* function */ 

coverage_0xea6679bd(0x5d2bd0e5a1a18ce8946ab41b9d0638a8e58053d2b6a216d8ffaf020bb2d96401); /* line */ 
        coverage_0xea6679bd(0x115474a762ec39d87c3f1231d5935e59a316edcf83b9d1a8d1e627a74a19eef2); /* statement */ 
Types.AssetAmount memory output;
coverage_0xea6679bd(0x8eec336205692a5cfa2fb842b87220960a0cb20fb931c42c461ce731cd64f03a); /* line */ 
        coverage_0xea6679bd(0x84ec78c96bb799501b97efb35175084860c1da90e5fbeb6f94a3a0fb81d89481); /* statement */ 
Types.Wei memory maxOutputWei = SOLO_MARGIN.getAccountWei(makerAccount, outputMarketId);

coverage_0xea6679bd(0x5977d23af26c5897d73292dbfa6a52a1025ba2696312468ad1a8f59448e00f88); /* line */ 
        coverage_0xea6679bd(0xa51584017f9cf0e9fbcad2aad33f5a97b27bcfbc9970dc8feadceeee0db44fb0); /* statement */ 
if (inputWei.isPositive()) {coverage_0xea6679bd(0x11fc9f026e587180ad45a24673bd88be23e31f1e8ccf89900d3b939bb5797ad7); /* branch */ 

coverage_0xea6679bd(0xdad8eb2b22f59320d0434d23e1c8008dee3a8c140c9a7c4a44047eebd15d195d); /* line */ 
            coverage_0xea6679bd(0x035a7862559e021faa8ea07493800eba16587a956cf331c2e287831c4dcfe3de); /* statement */ 
Require.that(
                inputMarketId == owedMarketId,
                FILE,
                "inputMarket mismatch",
                inputMarketId
            );
coverage_0xea6679bd(0x9f2d9170ad4acc867604774826550681e0d83012c9eb217fdfc0e7fa00094f54); /* line */ 
            coverage_0xea6679bd(0x6f958134e468d9fe01ec7d59ba678d8bfad72f4f4dd9d0007792eb3b571f9313); /* statement */ 
Require.that(
                !newInputPar.isPositive(),
                FILE,
                "Borrows cannot be overpaid",
                newInputPar.value
            );
coverage_0xea6679bd(0x43838d929a7b002322a4f0314a98b9dc66ea53279b98ae6b0f0b607b32f52b6b); /* line */ 
            coverage_0xea6679bd(0xc67e62e1a29d2414f64de99d10babcea30bea68ad9f77e06006820452430fadd); /* assertPre */ 
coverage_0xea6679bd(0xdfac947c04cb0732329b8776a6779f7c47f9ecc8c4805c4b330d024be0f6d961); /* statement */ 
assert(oldInputPar.isNegative());coverage_0xea6679bd(0x6b3e8c6cf12564800b159c252ad1b8b1909feb53f4c312d2c23cd27f95054dfd); /* assertPost */ 

coverage_0xea6679bd(0xe4f7230c8634795b3872b59d8a6a29b10767994b2709b0ef332494e7dda5a4d9); /* line */ 
            coverage_0xea6679bd(0x195b27682c7fcefc7ec0305fb36dc8485ffc8e7a23ca9783a0bf9d28c4c487c9); /* statement */ 
Require.that(
                maxOutputWei.isPositive(),
                FILE,
                "Collateral must be positive",
                outputMarketId,
                maxOutputWei.value
            );
coverage_0xea6679bd(0x38ada2f5c7cf82594c15b2e7e092f571b2dd922f1773b142315d9f43020da21e); /* line */ 
            coverage_0xea6679bd(0x6cb2d5c7faaf2cc924380ece5a2c5c60103f415d67bccaee1c9e74c30724d9d5); /* statement */ 
output = owedWeiToHeldWei(
                inputWei,
                outputMarketId,
                inputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
coverage_0xea6679bd(0x30062ea5dca0068e71fd3aa7df32be28879636166e399ca75dfba2e273ee201b); /* line */ 
            coverage_0xea6679bd(0x474f31593726bbf507c1f644d070a15a376562bb5ce795b66596333acabee03d); /* statement */ 
if (newInputPar.isZero()) {coverage_0xea6679bd(0x20ece412305b89d1bb256408858af1aa1e183360791d81398c7407e54eb31255); /* branch */ 

coverage_0xea6679bd(0x544be875ef1a2d7966809f874eb0d22edbe37585c176e0b18c94527e65154bed); /* line */ 
                coverage_0xea6679bd(0x782098c61141f6c1f1550ec40a6423949fdd4d68d67684ef9bc3100f3a0828d1); /* statement */ 
setExpiry(makerAccount, owedMarketId, 0);
            }else { coverage_0xea6679bd(0x9b9283b8203c02f3d9189e0b01ea5b2d132031b85e5472288cb3a1ef76074287); /* branch */ 
}
        } else {coverage_0xea6679bd(0xdc66d354ec39f32ab548c1012c66cf77f9b073c4e0734ae4c01d3a4eecc3d072); /* branch */ 

coverage_0xea6679bd(0x20205f0bab4c80e1b7315293d0b6f54e0a5e573fa10fce1b340a11198e763433); /* line */ 
            coverage_0xea6679bd(0x2030120cde3cabeaa25b3eea5795332537cc55f08634696b4cf725f695915c74); /* statement */ 
Require.that(
                outputMarketId == owedMarketId,
                FILE,
                "outputMarket mismatch",
                outputMarketId
            );
coverage_0xea6679bd(0x4c003a398b45b072dc9cd354187082b55d258796fef088b122bfd55293e23c26); /* line */ 
            coverage_0xea6679bd(0xff1d5d9de6a07f6b42ae8473264ea705f7019a2d8cceb16fc3577d1cb2deed3d); /* statement */ 
Require.that(
                !newInputPar.isNegative(),
                FILE,
                "Collateral cannot be overused",
                newInputPar.value
            );
coverage_0xea6679bd(0xd3339c075a624cf4228ca38039f499c8e1943e68581091f006aec3a6e89c9e74); /* line */ 
            coverage_0xea6679bd(0xbbb7680b55e64df4687cafccf868c4c4824b5a4b7c5128884c103be713a056f0); /* assertPre */ 
coverage_0xea6679bd(0xd4d516b78c0e5d21d4a7a144f403d8ccbc236cf42b8124c79bcda73011eb3bc7); /* statement */ 
assert(oldInputPar.isPositive());coverage_0xea6679bd(0x29e3f35201a3f0e64cab8d7ecbe2ea68e744b35abb999b1826a927662c1e1b93); /* assertPost */ 

coverage_0xea6679bd(0xb9e2c75847931ed6d718ba9a7bcec28427b85927dee76d33c4ff85412aeaaacf); /* line */ 
            coverage_0xea6679bd(0xaaec0759a643ddae7442001fffc166f890812e37879ad79f3492269d4668783c); /* statement */ 
Require.that(
                maxOutputWei.isNegative(),
                FILE,
                "Borrows must be negative",
                outputMarketId,
                maxOutputWei.value
            );
coverage_0xea6679bd(0x4ffa05587af4a5c0ac4ab6ce63f8ac66f91e426c6b36ea912165c520918926b3); /* line */ 
            coverage_0xea6679bd(0x3a27876f62f3a93760c1b446463a9593b8e8762d9cd91f882704c58bc498020b); /* statement */ 
output = heldWeiToOwedWei(
                inputWei,
                inputMarketId,
                outputMarketId,
                expiry
            );

            // clear expiry if borrow is fully repaid
coverage_0xea6679bd(0xa3a721a97dee2b9403cd9f003b6725b439035ff34fe40a122b04634bb06c63d2); /* line */ 
            coverage_0xea6679bd(0xeab42ad666a105dae62261058f22f3e015514f08ebd8cbf13170c6360c56f50d); /* statement */ 
if (output.value == maxOutputWei.value) {coverage_0xea6679bd(0xf640cc4b2c953c6effa2668bc6bc78112621a1f896e28fdccce8cdbee02acbb4); /* branch */ 

coverage_0xea6679bd(0x16ec340eb2aff87e8abde89a0529a8b7c43ef42f6f811d2785bd03779b6bb752); /* line */ 
                coverage_0xea6679bd(0xa748028fcd958c01a4fc0f43ba4aa3d4eeb200c938308dcb02f25f5643f53ac2); /* statement */ 
setExpiry(makerAccount, owedMarketId, 0);
            }else { coverage_0xea6679bd(0x8a11d557f5683fd70c89d3ff69e3e64a0f1c441ed9f38a420f76f2e84874a686); /* branch */ 
}
        }

coverage_0xea6679bd(0xac2a6e34ab626ef1ff8c8ad53b97a53be0dbfc270426b0840325dece278edda9); /* line */ 
        coverage_0xea6679bd(0x8f78d2a51104113d088919587adbd309462a9dbcd9793543c4299aa5d0daf008); /* statement */ 
Require.that(
            output.value <= maxOutputWei.value,
            FILE,
            "outputMarket too small",
            output.value,
            maxOutputWei.value
        );
coverage_0xea6679bd(0xe298aac6578024a2fa46cbb2e0d2fab9f7a32b9551060d66ee8885e920fd6335); /* line */ 
        coverage_0xea6679bd(0x200984747083febca88003ac0c9240bdf81d2c89cade84204a79c45b90bee9a8); /* assertPre */ 
coverage_0xea6679bd(0x7501897873eb139f110e35915afe59c6d2e9b0cad5b9bc458ae608e8922a0579); /* statement */ 
assert(output.sign != maxOutputWei.sign);coverage_0xea6679bd(0x470958853738a598872cc2d94dd869b3a2f8cd9bf35c0b811c4d65b98233d526); /* assertPost */ 


coverage_0xea6679bd(0x9fcca4a660bb41d34ac20fe316ea9ad82ae1e69b013d203c107ffe63f934555e); /* line */ 
        coverage_0xea6679bd(0xf11c2dd411914f3ac7e78303a87f4d4ec0d019f2197490c38a50afdcb02489d9); /* statement */ 
return output;
    }

    function setExpiry(
        Account.Info memory account,
        uint256 marketId,
        uint32 time
    )
        private
    {coverage_0xea6679bd(0xe893c571bd6b85787630441f758a9f0d886b1e863e746c3f03d7337b99816818); /* function */ 

coverage_0xea6679bd(0x490cd3749ac05f0391fca4739103ad321dad43cbfd7784e4a1aab762e5c71344); /* line */ 
        coverage_0xea6679bd(0x70285d8f61022324730759218d24f07e9ea71b22c7b8050fc3748a39dd0d916f); /* statement */ 
g_expiries[account.owner][account.number][marketId] = time;
coverage_0xea6679bd(0x977d8a040caa74ea4d10ebffca93f4b7d09b92e5c3357a4f3e39971699fef7e1); /* line */ 
        coverage_0xea6679bd(0xd9ff57d6a6e85c63c55b59940e6c247506dd78ce6ec05264d0f965e08813c96c); /* statement */ 
emit ExpirySet(
            account.owner,
            account.number,
            marketId,
            time
        );
    }

    function setApproval(
        address approver,
        address sender,
        uint32 minTimeDelta
    )
        private
    {coverage_0xea6679bd(0x321eaf89b5fba3fb8a55a999c621c3190df01d7dbf6524d4dfed726dedabbea3); /* function */ 

coverage_0xea6679bd(0xd9a0dd01f27d0570f9a9c3a8eb91d4a30e66e77c4b9dad7912af696c5d9d28d1); /* line */ 
        coverage_0xea6679bd(0x1522f5fcdba02acaa48a24e40729d254b46d5449ef843344c52a7ce922c558ec); /* statement */ 
g_approvedSender[approver][sender] = minTimeDelta;
coverage_0xea6679bd(0xa0ca7fd34a9d6a1ee9b0d658f18bfd450b4b60dea7e900373560afcee4972eaf); /* line */ 
        coverage_0xea6679bd(0x5f8657d5c6fd42bd6079423de1ca09485aa07962b0b1e9042195e42288155d93); /* statement */ 
emit LogSenderApproved(approver, sender, minTimeDelta);
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
    {coverage_0xea6679bd(0xddcdf255266725d6472f94fac27825a1ad632d9c3d5736fe1775fcdfc81f627e); /* function */ 

coverage_0xea6679bd(0x147970c280cfef564b0a24a7d2f292d96680c083d03c96b8c03990557ed12458); /* line */ 
        coverage_0xea6679bd(0x0888b2a2a1d2e00bb170a80de260d4d56fd5b5d5bf807599f8478ae6d9476418); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            expiry
        );

coverage_0xea6679bd(0xaf4d430d52e14fe61c427545311197dca8dfc7af3aac5594c4cb6083eb008a63); /* line */ 
        coverage_0xea6679bd(0x23e6b29e72ddf622199834ed001abc01ea52766265a23aed6852f0863d0d04f7); /* statement */ 
uint256 owedAmount = Math.getPartialRoundUp(
            heldWei.value,
            heldPrice.value,
            owedPrice.value
        );

coverage_0xea6679bd(0x7fb156a2c5a4a857d8977bdfe1e77cecc2fb2acc352c849dd3bd6d19d38f81d0); /* line */ 
        coverage_0xea6679bd(0x5086f720e24d38aed2c9cc3818c770df2571c199fd807063c592d88fcaab610f); /* statement */ 
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
    {coverage_0xea6679bd(0xcfbcb7478e591ceab0593ab4f615c87590435ccf9c97bd8f74cc6e9b6020ee6f); /* function */ 

coverage_0xea6679bd(0x18c4981e501bc28768520c080c14f908ea5ab237708c0f899ae1993dddef2aac); /* line */ 
        coverage_0xea6679bd(0xb488e0a767be17d665a87c7306b4c4e6b52c665ea138311c6b5588c8bdb93462); /* statement */ 
(
            Monetary.Price memory heldPrice,
            Monetary.Price memory owedPrice
        ) = getSpreadAdjustedPrices(
            heldMarketId,
            owedMarketId,
            expiry
        );

coverage_0xea6679bd(0x07f0827147de7702ca4bd75f7a83dc9c0dcfcdd02d317fef7debfdbd0eb305ca); /* line */ 
        coverage_0xea6679bd(0x2f6ee76e645d4eb947fad0044ef47529fc6d648e45cedbf37b1364e157669a3a); /* statement */ 
uint256 heldAmount = Math.getPartial(
            owedWei.value,
            owedPrice.value,
            heldPrice.value
        );

coverage_0xea6679bd(0xca55259eaeac8cfd772c2b79f49ec4b62e54bff2e443ffe72f8a4bd604325cd0); /* line */ 
        coverage_0xea6679bd(0x118fd77b1f7831320e00788e27a54ee73f80fd793f56c43e6b23ade2cf729d53); /* statement */ 
return Types.AssetAmount({
            sign: false,
            denomination: Types.AssetDenomination.Wei,
            ref: Types.AssetReference.Delta,
            value: heldAmount
        });
    }
}
