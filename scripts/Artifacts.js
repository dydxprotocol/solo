"use strict";
/**
 * To publish a contract with the published npm package, include it here
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var SoloMargin_json_1 = __importDefault(require("../build/contracts/SoloMargin.json"));
var IERC20_json_1 = __importDefault(require("../build/contracts/IERC20.json"));
var IInterestSetter_json_1 = __importDefault(require("../build/contracts/IInterestSetter.json"));
var IPriceOracle_json_1 = __importDefault(require("../build/contracts/IPriceOracle.json"));
var Expiry_json_1 = __importDefault(require("../build/contracts/Expiry.json"));
var ExpiryV2_json_1 = __importDefault(require("../build/contracts/ExpiryV2.json"));
var Refunder_json_1 = __importDefault(require("../build/contracts/Refunder.json"));
var DaiMigrator_json_1 = __importDefault(require("../build/contracts/DaiMigrator.json"));
var LimitOrders_json_1 = __importDefault(require("../build/contracts/LimitOrders.json"));
var StopLimitOrders_json_1 = __importDefault(require("../build/contracts/StopLimitOrders.json"));
var CanonicalOrders_json_1 = __importDefault(require("../build/contracts/CanonicalOrders.json"));
var PayableProxyForSoloMargin_json_1 = __importDefault(require("../build/contracts/PayableProxyForSoloMargin.json"));
var SignedOperationProxy_json_1 = __importDefault(require("../build/contracts/SignedOperationProxy.json"));
var LiquidatorProxyV1ForSoloMargin_json_1 = __importDefault(require("../build/contracts/LiquidatorProxyV1ForSoloMargin.json"));
var PolynomialInterestSetter_json_1 = __importDefault(require("../build/contracts/PolynomialInterestSetter.json"));
var DoubleExponentInterestSetter_json_1 = __importDefault(require("../build/contracts/DoubleExponentInterestSetter.json"));
var WethPriceOracle_json_1 = __importDefault(require("../build/contracts/WethPriceOracle.json"));
var DaiPriceOracle_json_1 = __importDefault(require("../build/contracts/DaiPriceOracle.json"));
var UsdcPriceOracle_json_1 = __importDefault(require("../build/contracts/UsdcPriceOracle.json"));
var WETH9_json_1 = __importDefault(require("../build/contracts/WETH9.json"));
var Events_json_1 = __importDefault(require("../build/contracts/Events.json"));
var AdminImpl_json_1 = __importDefault(require("../build/contracts/AdminImpl.json"));
var OperationImpl_json_1 = __importDefault(require("../build/contracts/OperationImpl.json"));
var Permission_json_1 = __importDefault(require("../build/contracts/Permission.json"));
var PartiallyDelayedMultiSig_json_1 = __importDefault(require("../build/contracts/PartiallyDelayedMultiSig.json"));
var ChainlinkPriceOracleV1_json_1 = __importDefault(require("../build/contracts/ChainlinkPriceOracleV1.json"));
exports.default = {
    SoloMargin: SoloMargin_json_1.default,
    IERC20: IERC20_json_1.default,
    IInterestSetter: IInterestSetter_json_1.default,
    IPriceOracle: IPriceOracle_json_1.default,
    Expiry: Expiry_json_1.default,
    ExpiryV2: ExpiryV2_json_1.default,
    Refunder: Refunder_json_1.default,
    DaiMigrator: DaiMigrator_json_1.default,
    LimitOrders: LimitOrders_json_1.default,
    StopLimitOrders: StopLimitOrders_json_1.default,
    CanonicalOrders: CanonicalOrders_json_1.default,
    PayableProxyForSoloMargin: PayableProxyForSoloMargin_json_1.default,
    SignedOperationProxy: SignedOperationProxy_json_1.default,
    LiquidatorProxyV1ForSoloMargin: LiquidatorProxyV1ForSoloMargin_json_1.default,
    PolynomialInterestSetter: PolynomialInterestSetter_json_1.default,
    DoubleExponentInterestSetter: DoubleExponentInterestSetter_json_1.default,
    WethPriceOracle: WethPriceOracle_json_1.default,
    DaiPriceOracle: DaiPriceOracle_json_1.default,
    UsdcPriceOracle: UsdcPriceOracle_json_1.default,
    Weth: WETH9_json_1.default,
    Events: Events_json_1.default,
    AdminImpl: AdminImpl_json_1.default,
    OperationImpl: OperationImpl_json_1.default,
    Permission: Permission_json_1.default,
    PartiallyDelayedMultiSig: PartiallyDelayedMultiSig_json_1.default,
    ChainlinkPriceOracleV1: ChainlinkPriceOracleV1_json_1.default,
};
//# sourceMappingURL=Artifacts.js.map