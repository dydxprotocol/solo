"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSide = exports.ApiOrderUpdateType = exports.OrderType = exports.ApiLiquidity = exports.ApiOrderCancelReason = exports.ApiMarketName = exports.ApiFillStatus = exports.ApiOrderStatus = exports.ApiOrderType = exports.ApiOrderTypeV2 = exports.LimitOrderCallFunctionType = exports.LimitOrderStatus = exports.ExpiryV2CallFunctionType = exports.AccountStatus = exports.ActionType = exports.AmountReference = exports.AmountDenomination = exports.SigningMethod = exports.ProxyType = exports.Networks = exports.MarketId = exports.ConfirmationType = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var ConfirmationType;
(function (ConfirmationType) {
    ConfirmationType[ConfirmationType["Hash"] = 0] = "Hash";
    ConfirmationType[ConfirmationType["Confirmed"] = 1] = "Confirmed";
    ConfirmationType[ConfirmationType["Both"] = 2] = "Both";
    ConfirmationType[ConfirmationType["Simulate"] = 3] = "Simulate";
})(ConfirmationType = exports.ConfirmationType || (exports.ConfirmationType = {}));
exports.MarketId = {
    WETH: new bignumber_js_1.default(0),
    SAI: new bignumber_js_1.default(1),
    USDC: new bignumber_js_1.default(2),
    DAI: new bignumber_js_1.default(3),
    // This market number does not exist on the protocol,
    // but can be used for standard actions
    ETH: new bignumber_js_1.default(-1),
};
exports.Networks = {
    MAINNET: 1,
    KOVAN: 42,
};
var ProxyType;
(function (ProxyType) {
    ProxyType["None"] = "None";
    ProxyType["Payable"] = "Payable";
    ProxyType["Sender"] = "Sender";
    ProxyType["Signed"] = "Sender";
})(ProxyType = exports.ProxyType || (exports.ProxyType = {}));
var SigningMethod;
(function (SigningMethod) {
    SigningMethod["Compatibility"] = "Compatibility";
    SigningMethod["UnsafeHash"] = "UnsafeHash";
    SigningMethod["Hash"] = "Hash";
    SigningMethod["TypedData"] = "TypedData";
    SigningMethod["MetaMask"] = "MetaMask";
    SigningMethod["MetaMaskLatest"] = "MetaMaskLatest";
    SigningMethod["CoinbaseWallet"] = "CoinbaseWallet";
})(SigningMethod = exports.SigningMethod || (exports.SigningMethod = {}));
var AmountDenomination;
(function (AmountDenomination) {
    AmountDenomination[AmountDenomination["Actual"] = 0] = "Actual";
    AmountDenomination[AmountDenomination["Principal"] = 1] = "Principal";
    AmountDenomination[AmountDenomination["Wei"] = 0] = "Wei";
    AmountDenomination[AmountDenomination["Par"] = 1] = "Par";
})(AmountDenomination = exports.AmountDenomination || (exports.AmountDenomination = {}));
var AmountReference;
(function (AmountReference) {
    AmountReference[AmountReference["Delta"] = 0] = "Delta";
    AmountReference[AmountReference["Target"] = 1] = "Target";
})(AmountReference = exports.AmountReference || (exports.AmountReference = {}));
var ActionType;
(function (ActionType) {
    ActionType[ActionType["Deposit"] = 0] = "Deposit";
    ActionType[ActionType["Withdraw"] = 1] = "Withdraw";
    ActionType[ActionType["Transfer"] = 2] = "Transfer";
    ActionType[ActionType["Buy"] = 3] = "Buy";
    ActionType[ActionType["Sell"] = 4] = "Sell";
    ActionType[ActionType["Trade"] = 5] = "Trade";
    ActionType[ActionType["Liquidate"] = 6] = "Liquidate";
    ActionType[ActionType["Vaporize"] = 7] = "Vaporize";
    ActionType[ActionType["Call"] = 8] = "Call";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus[AccountStatus["Normal"] = 0] = "Normal";
    AccountStatus[AccountStatus["Liquidating"] = 1] = "Liquidating";
    AccountStatus[AccountStatus["Vaporizing"] = 2] = "Vaporizing";
})(AccountStatus = exports.AccountStatus || (exports.AccountStatus = {}));
var ExpiryV2CallFunctionType;
(function (ExpiryV2CallFunctionType) {
    ExpiryV2CallFunctionType[ExpiryV2CallFunctionType["SetExpiry"] = 0] = "SetExpiry";
    ExpiryV2CallFunctionType[ExpiryV2CallFunctionType["SetApproval"] = 1] = "SetApproval";
})(ExpiryV2CallFunctionType = exports.ExpiryV2CallFunctionType || (exports.ExpiryV2CallFunctionType = {}));
var LimitOrderStatus;
(function (LimitOrderStatus) {
    LimitOrderStatus[LimitOrderStatus["Null"] = 0] = "Null";
    LimitOrderStatus[LimitOrderStatus["Approved"] = 1] = "Approved";
    LimitOrderStatus[LimitOrderStatus["Canceled"] = 2] = "Canceled";
})(LimitOrderStatus = exports.LimitOrderStatus || (exports.LimitOrderStatus = {}));
var LimitOrderCallFunctionType;
(function (LimitOrderCallFunctionType) {
    LimitOrderCallFunctionType[LimitOrderCallFunctionType["Approve"] = 0] = "Approve";
    LimitOrderCallFunctionType[LimitOrderCallFunctionType["Cancel"] = 1] = "Cancel";
    LimitOrderCallFunctionType[LimitOrderCallFunctionType["SetFillArgs"] = 2] = "SetFillArgs";
})(LimitOrderCallFunctionType = exports.LimitOrderCallFunctionType || (exports.LimitOrderCallFunctionType = {}));
// ============ Api ============
var ApiOrderTypeV2;
(function (ApiOrderTypeV2) {
    ApiOrderTypeV2["LIMIT"] = "LIMIT";
    ApiOrderTypeV2["ISOLATED_MARKET"] = "ISOLATED_MARKET";
    ApiOrderTypeV2["STOP_LIMIT"] = "STOP_LIMIT";
})(ApiOrderTypeV2 = exports.ApiOrderTypeV2 || (exports.ApiOrderTypeV2 = {}));
var ApiOrderType;
(function (ApiOrderType) {
    ApiOrderType["LIMIT_V1"] = "dydexLimitV1";
})(ApiOrderType = exports.ApiOrderType || (exports.ApiOrderType = {}));
var ApiOrderStatus;
(function (ApiOrderStatus) {
    ApiOrderStatus["PENDING"] = "PENDING";
    ApiOrderStatus["OPEN"] = "OPEN";
    ApiOrderStatus["FILLED"] = "FILLED";
    ApiOrderStatus["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
    ApiOrderStatus["CANCELED"] = "CANCELED";
    ApiOrderStatus["UNTRIGGERED"] = "UNTRIGGERED";
})(ApiOrderStatus = exports.ApiOrderStatus || (exports.ApiOrderStatus = {}));
var ApiFillStatus;
(function (ApiFillStatus) {
    ApiFillStatus["PENDING"] = "PENDING";
    ApiFillStatus["REVERTED"] = "REVERTED";
    ApiFillStatus["CONFIRMED"] = "CONFIRMED";
})(ApiFillStatus = exports.ApiFillStatus || (exports.ApiFillStatus = {}));
var ApiMarketName;
(function (ApiMarketName) {
    ApiMarketName["WETH_DAI"] = "WETH-DAI";
    ApiMarketName["WETH_USDC"] = "WETH-USDC";
    ApiMarketName["DAI_USDC"] = "DAI-USDC";
})(ApiMarketName = exports.ApiMarketName || (exports.ApiMarketName = {}));
var ApiOrderCancelReason;
(function (ApiOrderCancelReason) {
    ApiOrderCancelReason["EXPIRED"] = "EXPIRED";
    ApiOrderCancelReason["UNDERCOLLATERALIZED"] = "UNDERCOLLATERALIZED";
    ApiOrderCancelReason["CANCELED_ON_CHAIN"] = "CANCELED_ON_CHAIN";
    ApiOrderCancelReason["USER_CANCELED"] = "USER_CANCELED";
    ApiOrderCancelReason["SELF_TRADE"] = "SELF_TRADE";
    ApiOrderCancelReason["FAILED"] = "FAILED";
    ApiOrderCancelReason["COULD_NOT_FILL"] = "COULD_NOT_FILL";
    ApiOrderCancelReason["POST_ONLY_WOULD_CROSS"] = "POST_ONLY_WOULD_CROSS";
})(ApiOrderCancelReason = exports.ApiOrderCancelReason || (exports.ApiOrderCancelReason = {}));
var ApiLiquidity;
(function (ApiLiquidity) {
    ApiLiquidity["TAKER"] = "TAKER";
    ApiLiquidity["MAKER"] = "MAKER";
})(ApiLiquidity = exports.ApiLiquidity || (exports.ApiLiquidity = {}));
var OrderType;
(function (OrderType) {
    OrderType["DYDX"] = "dydexLimitV1";
    OrderType["ETH_2_DAI"] = "OasisV3";
    OrderType["ZERO_EX"] = "0x-V2";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var ApiOrderUpdateType;
(function (ApiOrderUpdateType) {
    ApiOrderUpdateType["NEW"] = "NEW";
    ApiOrderUpdateType["REMOVED"] = "REMOVED";
    ApiOrderUpdateType["UPDATED"] = "UPDATED";
})(ApiOrderUpdateType = exports.ApiOrderUpdateType || (exports.ApiOrderUpdateType = {}));
var ApiSide;
(function (ApiSide) {
    ApiSide["BUY"] = "BUY";
    ApiSide["SELL"] = "SELL";
})(ApiSide = exports.ApiSide || (exports.ApiSide = {}));
//# sourceMappingURL=types.js.map