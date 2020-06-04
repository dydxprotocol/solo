"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountOperation = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var types_1 = require("../../types");
var BytesHelper_1 = require("../../lib/BytesHelper");
var Helpers_1 = require("../../lib/Helpers");
var Constants_1 = require("../../lib/Constants");
var expiry_constants_json_1 = __importDefault(require("../../lib/expiry-constants.json"));
var AccountOperation = /** @class */ (function () {
    function AccountOperation(contracts, orderMapper, limitOrders, stopLimitOrders, canonicalOrders, networkId, options) {
        // use the passed-in proxy type, but support the old way of passing in `usePayableProxy = true`
        var proxy = options.proxy ||
            (options.usePayableProxy ? types_1.ProxyType.Payable : null) ||
            types_1.ProxyType.None;
        this.contracts = contracts;
        this.actions = [];
        this.committed = false;
        this.orderMapper = orderMapper;
        this.limitOrders = limitOrders;
        this.stopLimitOrders = stopLimitOrders;
        this.canonicalOrders = canonicalOrders;
        this.accounts = [];
        this.proxy = proxy;
        this.sendEthTo = options.sendEthTo;
        this.auths = [];
        this.networkId = networkId;
    }
    AccountOperation.prototype.deposit = function (deposit) {
        this.addActionArgs(deposit, {
            actionType: types_1.ActionType.Deposit,
            amount: deposit.amount,
            otherAddress: deposit.from,
            primaryMarketId: deposit.marketId.toFixed(0),
        });
        return this;
    };
    AccountOperation.prototype.withdraw = function (withdraw) {
        this.addActionArgs(withdraw, {
            amount: withdraw.amount,
            actionType: types_1.ActionType.Withdraw,
            otherAddress: withdraw.to,
            primaryMarketId: withdraw.marketId.toFixed(0),
        });
        return this;
    };
    AccountOperation.prototype.transfer = function (transfer) {
        this.addActionArgs(transfer, {
            actionType: types_1.ActionType.Transfer,
            amount: transfer.amount,
            primaryMarketId: transfer.marketId.toFixed(0),
            otherAccountId: this.getAccountId(transfer.toAccountOwner, transfer.toAccountId),
        });
        return this;
    };
    AccountOperation.prototype.buy = function (buy) {
        return this.exchange(buy, types_1.ActionType.Buy);
    };
    AccountOperation.prototype.sell = function (sell) {
        return this.exchange(sell, types_1.ActionType.Sell);
    };
    AccountOperation.prototype.liquidate = function (liquidate) {
        this.addActionArgs(liquidate, {
            actionType: types_1.ActionType.Liquidate,
            amount: liquidate.amount,
            primaryMarketId: liquidate.liquidMarketId.toFixed(0),
            secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
            otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
        });
        return this;
    };
    AccountOperation.prototype.vaporize = function (vaporize) {
        this.addActionArgs(vaporize, {
            actionType: types_1.ActionType.Vaporize,
            amount: vaporize.amount,
            primaryMarketId: vaporize.vaporMarketId.toFixed(0),
            secondaryMarketId: vaporize.payoutMarketId.toFixed(0),
            otherAccountId: this.getAccountId(vaporize.vaporAccountOwner, vaporize.vaporAccountId),
        });
        return this;
    };
    AccountOperation.prototype.setExpiry = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.expiry.options.address,
            data: BytesHelper_1.toBytes(args.marketId, args.expiryTime),
        });
        return this;
    };
    AccountOperation.prototype.setApprovalForExpiryV2 = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.expiryV2.options.address,
            data: BytesHelper_1.toBytes(types_1.ExpiryV2CallFunctionType.SetApproval, args.sender, args.minTimeDelta),
        });
        return this;
    };
    AccountOperation.prototype.setExpiryV2 = function (args) {
        var callType = BytesHelper_1.toBytes(types_1.ExpiryV2CallFunctionType.SetExpiry);
        var callData = callType;
        callData = callData.concat(BytesHelper_1.toBytes(new bignumber_js_1.default(64)));
        callData = callData.concat(BytesHelper_1.toBytes(new bignumber_js_1.default(args.expiryV2Args.length)));
        for (var i = 0; i < args.expiryV2Args.length; i += 1) {
            var expiryV2Arg = args.expiryV2Args[i];
            callData = callData.concat(BytesHelper_1.toBytes(expiryV2Arg.accountOwner, expiryV2Arg.accountId, expiryV2Arg.marketId, expiryV2Arg.timeDelta, expiryV2Arg.forceUpdate));
        }
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.expiryV2.options.address,
            data: callData,
        });
        return this;
    };
    AccountOperation.prototype.approveLimitOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.limitOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Approve, this.limitOrders.unsignedOrderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.cancelLimitOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.limitOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Cancel, this.limitOrders.unsignedOrderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.approveStopLimitOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.stopLimitOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Approve, this.stopLimitOrders.unsignedOrderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.cancelStopLimitOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.stopLimitOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Cancel, this.stopLimitOrders.unsignedOrderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.approveCanonicalOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.canonicalOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Approve, this.canonicalOrders.orderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.cancelCanonicalOrder = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.canonicalOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.Cancel, this.canonicalOrders.orderToBytes(args.order)),
        });
        return this;
    };
    AccountOperation.prototype.setCanonicalOrderFillArgs = function (primaryAccountOwner, primaryAccountId, price, fee) {
        this.addActionArgs({
            primaryAccountOwner: primaryAccountOwner,
            primaryAccountId: primaryAccountId,
        }, {
            actionType: types_1.ActionType.Call,
            otherAddress: this.contracts.canonicalOrders.options.address,
            data: BytesHelper_1.toBytes(types_1.LimitOrderCallFunctionType.SetFillArgs, this.canonicalOrders.toSolidity(price), this.canonicalOrders.toSolidity(fee.abs()), fee.isNegative()),
        });
        return this;
    };
    AccountOperation.prototype.call = function (args) {
        this.addActionArgs(args, {
            actionType: types_1.ActionType.Call,
            otherAddress: args.callee,
            data: args.data,
        });
        return this;
    };
    AccountOperation.prototype.trade = function (trade) {
        this.addActionArgs(trade, {
            actionType: types_1.ActionType.Trade,
            amount: trade.amount,
            primaryMarketId: trade.inputMarketId.toFixed(0),
            secondaryMarketId: trade.outputMarketId.toFixed(0),
            otherAccountId: this.getAccountId(trade.otherAccountOwner, trade.otherAccountId),
            otherAddress: trade.autoTrader,
            data: trade.data,
        });
        return this;
    };
    AccountOperation.prototype.fillSignedLimitOrder = function (primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount) {
        if (denotedInMakerAmount === void 0) { denotedInMakerAmount = false; }
        return this.fillLimitOrderInternal(primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount, true);
    };
    AccountOperation.prototype.fillPreApprovedLimitOrder = function (primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount) {
        if (denotedInMakerAmount === void 0) { denotedInMakerAmount = false; }
        return this.fillLimitOrderInternal(primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount, false);
    };
    AccountOperation.prototype.fillSignedDecreaseOnlyStopLimitOrder = function (primaryAccountOwner, primaryAccountNumber, order, denotedInMakerAmount) {
        if (denotedInMakerAmount === void 0) { denotedInMakerAmount = false; }
        var amount = {
            denomination: types_1.AmountDenomination.Par,
            reference: types_1.AmountReference.Target,
            value: Constants_1.INTEGERS.ZERO,
        };
        return this.fillStopLimitOrderInternal(primaryAccountOwner, primaryAccountNumber, order, amount, denotedInMakerAmount, true);
    };
    AccountOperation.prototype.fillSignedStopLimitOrder = function (primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount) {
        if (denotedInMakerAmount === void 0) { denotedInMakerAmount = false; }
        var amount = {
            denomination: types_1.AmountDenomination.Wei,
            reference: types_1.AmountReference.Delta,
            value: weiAmount.abs().times(denotedInMakerAmount ? -1 : 1),
        };
        return this.fillStopLimitOrderInternal(primaryAccountOwner, primaryAccountNumber, order, amount, denotedInMakerAmount, true);
    };
    AccountOperation.prototype.fillPreApprovedStopLimitOrder = function (primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount) {
        if (denotedInMakerAmount === void 0) { denotedInMakerAmount = false; }
        var amount = {
            denomination: types_1.AmountDenomination.Wei,
            reference: types_1.AmountReference.Delta,
            value: weiAmount.abs().times(denotedInMakerAmount ? -1 : 1),
        };
        return this.fillStopLimitOrderInternal(primaryAccountOwner, primaryAccountNumber, order, amount, denotedInMakerAmount, false);
    };
    AccountOperation.prototype.fillCanonicalOrder = function (primaryAccountOwner, primaryAccountNumber, order, amount, price, fee) {
        return this.trade({
            primaryAccountOwner: primaryAccountOwner,
            primaryAccountId: primaryAccountNumber,
            autoTrader: this.contracts.canonicalOrders.options.address,
            inputMarketId: order.baseMarket,
            outputMarketId: order.quoteMarket,
            otherAccountOwner: order.makerAccountOwner,
            otherAccountId: order.makerAccountNumber,
            data: BytesHelper_1.hexStringToBytes(this.canonicalOrders.orderToBytes(order, price, fee)),
            amount: {
                denomination: types_1.AmountDenomination.Wei,
                reference: types_1.AmountReference.Delta,
                value: order.isBuy ? amount : amount.negated(),
            },
        });
    };
    AccountOperation.prototype.fillDecreaseOnlyCanonicalOrder = function (primaryAccountOwner, primaryAccountNumber, order, price, fee) {
        return this.trade({
            primaryAccountOwner: primaryAccountOwner,
            primaryAccountId: primaryAccountNumber,
            autoTrader: this.contracts.canonicalOrders.options.address,
            inputMarketId: order.isBuy ? order.baseMarket : order.quoteMarket,
            outputMarketId: order.isBuy ? order.quoteMarket : order.baseMarket,
            otherAccountOwner: order.makerAccountOwner,
            otherAccountId: order.makerAccountNumber,
            data: BytesHelper_1.hexStringToBytes(this.canonicalOrders.orderToBytes(order, price, fee)),
            amount: {
                denomination: types_1.AmountDenomination.Par,
                reference: types_1.AmountReference.Target,
                value: Constants_1.INTEGERS.ZERO,
            },
        });
    };
    AccountOperation.prototype.refund = function (refundArgs) {
        return this.trade({
            primaryAccountOwner: refundArgs.primaryAccountOwner,
            primaryAccountId: refundArgs.primaryAccountId,
            inputMarketId: refundArgs.refundMarketId,
            outputMarketId: refundArgs.otherMarketId,
            otherAccountOwner: refundArgs.receiverAccountOwner,
            otherAccountId: refundArgs.receiverAccountId,
            amount: {
                value: refundArgs.wei,
                denomination: types_1.AmountDenomination.Actual,
                reference: types_1.AmountReference.Delta,
            },
            data: [],
            autoTrader: this.contracts.refunder.options.address,
        });
    };
    AccountOperation.prototype.daiMigrate = function (migrateArgs) {
        var saiMarket = new bignumber_js_1.default(1);
        var daiMarket = new bignumber_js_1.default(3);
        return this.trade({
            primaryAccountOwner: migrateArgs.primaryAccountOwner,
            primaryAccountId: migrateArgs.primaryAccountId,
            inputMarketId: saiMarket,
            outputMarketId: daiMarket,
            otherAccountOwner: migrateArgs.userAccountOwner,
            otherAccountId: migrateArgs.userAccountId,
            amount: migrateArgs.amount,
            data: [],
            autoTrader: this.contracts.daiMigrator.options.address,
        });
    };
    AccountOperation.prototype.liquidateExpiredAccount = function (liquidate, maxExpiry) {
        return this.liquidateExpiredAccountInternal(liquidate, maxExpiry || Constants_1.INTEGERS.ONES_31, this.contracts.expiry.options.address);
    };
    AccountOperation.prototype.liquidateExpiredAccountV2 = function (liquidate, maxExpiry) {
        return this.liquidateExpiredAccountInternal(liquidate, maxExpiry || Constants_1.INTEGERS.ONES_31, this.contracts.expiryV2.options.address);
    };
    AccountOperation.prototype.liquidateExpiredAccountInternal = function (liquidate, maxExpiryTimestamp, contractAddress) {
        this.addActionArgs(liquidate, {
            actionType: types_1.ActionType.Trade,
            amount: liquidate.amount,
            primaryMarketId: liquidate.liquidMarketId.toFixed(0),
            secondaryMarketId: liquidate.payoutMarketId.toFixed(0),
            otherAccountId: this.getAccountId(liquidate.liquidAccountOwner, liquidate.liquidAccountId),
            otherAddress: contractAddress,
            data: BytesHelper_1.toBytes(liquidate.liquidMarketId, maxExpiryTimestamp),
        });
        return this;
    };
    AccountOperation.prototype.fullyLiquidateExpiredAccount = function (primaryAccountOwner, primaryAccountNumber, expiredAccountOwner, expiredAccountNumber, expiredMarket, expiryTimestamp, blockTimestamp, weis, prices, spreadPremiums, collateralPreferences) {
        return this.fullyLiquidateExpiredAccountInternal(primaryAccountOwner, primaryAccountNumber, expiredAccountOwner, expiredAccountNumber, expiredMarket, expiryTimestamp, blockTimestamp, weis, prices, spreadPremiums, collateralPreferences, this.contracts.expiry.options.address);
    };
    AccountOperation.prototype.fullyLiquidateExpiredAccountV2 = function (primaryAccountOwner, primaryAccountNumber, expiredAccountOwner, expiredAccountNumber, expiredMarket, expiryTimestamp, blockTimestamp, weis, prices, spreadPremiums, collateralPreferences) {
        return this.fullyLiquidateExpiredAccountInternal(primaryAccountOwner, primaryAccountNumber, expiredAccountOwner, expiredAccountNumber, expiredMarket, expiryTimestamp, blockTimestamp, weis, prices, spreadPremiums, collateralPreferences, this.contracts.expiryV2.options.address);
    };
    AccountOperation.prototype.fullyLiquidateExpiredAccountInternal = function (primaryAccountOwner, primaryAccountNumber, expiredAccountOwner, expiredAccountNumber, expiredMarket, expiryTimestamp, blockTimestamp, weis, prices, spreadPremiums, collateralPreferences, contractAddress) {
        // hardcoded values
        var networkExpiryConstants = expiry_constants_json_1.default[this.networkId];
        var defaultSpread = new bignumber_js_1.default(networkExpiryConstants.spread);
        var expiryRampTime = new bignumber_js_1.default(networkExpiryConstants.expiryRampTime);
        // get info about the expired market
        var owedWei = weis[expiredMarket.toNumber()];
        var owedPrice = prices[expiredMarket.toNumber()];
        var owedSpreadMult = spreadPremiums[expiredMarket.toNumber()].plus(1);
        // error checking
        if (owedWei.gte(0)) {
            throw new Error('Expired account must have negative expired balance');
        }
        if (blockTimestamp.lt(expiryTimestamp)) {
            throw new Error('Expiry timestamp must be larger than blockTimestamp');
        }
        // loop through each collateral type as long as there is some borrow amount left
        for (var i = 0; i < collateralPreferences.length && owedWei.lt(0); i += 1) {
            // get info about the next collateral market
            var heldMarket = collateralPreferences[i];
            var heldWei = weis[heldMarket.toNumber()];
            var heldPrice = prices[heldMarket.toNumber()];
            var heldSpreadMult = spreadPremiums[heldMarket.toNumber()].plus(1);
            // skip this collateral market if the account is not positive in this market
            if (heldWei.lte(0)) {
                continue;
            }
            // get the relative value of each market
            var rampAdjustment = bignumber_js_1.default.min(blockTimestamp.minus(expiryTimestamp).div(expiryRampTime), Constants_1.INTEGERS.ONE);
            var spread = defaultSpread.times(heldSpreadMult).times(owedSpreadMult).plus(1);
            var heldValue = heldWei.times(heldPrice).abs();
            var owedValue = owedWei.times(owedPrice).times(rampAdjustment).times(spread).abs();
            // add variables that need to be populated
            var primaryMarketId = void 0;
            var secondaryMarketId = void 0;
            // set remaining owedWei and the marketIds depending on which market will 'bound' the action
            if (heldValue.gt(owedValue)) {
                // we expect no remaining owedWei
                owedWei = Constants_1.INTEGERS.ZERO;
                primaryMarketId = expiredMarket;
                secondaryMarketId = heldMarket;
            }
            else {
                // calculate the expected remaining owedWei
                owedWei = owedValue.minus(heldValue).div(owedValue).times(owedWei);
                primaryMarketId = heldMarket;
                secondaryMarketId = expiredMarket;
            }
            // add the action to the current actions
            this.addActionArgs({
                primaryAccountOwner: primaryAccountOwner,
                primaryAccountId: primaryAccountNumber,
            }, {
                actionType: types_1.ActionType.Trade,
                amount: {
                    value: Constants_1.INTEGERS.ZERO,
                    denomination: types_1.AmountDenomination.Principal,
                    reference: types_1.AmountReference.Target,
                },
                primaryMarketId: primaryMarketId.toFixed(0),
                secondaryMarketId: secondaryMarketId.toFixed(0),
                otherAccountId: this.getAccountId(expiredAccountOwner, expiredAccountNumber),
                otherAddress: contractAddress,
                data: BytesHelper_1.toBytes(expiredMarket, expiryTimestamp),
            });
        }
        return this;
    };
    /**
     * Adds all actions from a SignedOperation and also adds the authorization object that allows the
     * proxy to process the actions.
     */
    AccountOperation.prototype.addSignedOperation = function (signedOperation) {
        // throw error if operation is not going to use the signed proxy
        if (this.proxy !== types_1.ProxyType.Signed) {
            throw new Error('Cannot add signed operation if not using signed operation proxy');
        }
        // store the auth
        this.auths.push({
            startIndex: new bignumber_js_1.default(this.actions.length),
            numActions: new bignumber_js_1.default(signedOperation.actions.length),
            salt: signedOperation.salt,
            expiration: signedOperation.expiration,
            sender: signedOperation.sender,
            signer: signedOperation.signer,
            typedSignature: signedOperation.typedSignature,
        });
        // store the actions
        for (var i = 0; i < signedOperation.actions.length; i += 1) {
            var action = signedOperation.actions[i];
            var secondaryAccountId = action.secondaryAccountOwner === Constants_1.ADDRESSES.ZERO
                ? 0
                : this.getAccountId(action.secondaryAccountOwner, action.secondaryAccountNumber);
            this.addActionArgs({
                primaryAccountOwner: action.primaryAccountOwner,
                primaryAccountId: action.primaryAccountNumber,
            }, {
                actionType: action.actionType,
                primaryMarketId: action.primaryMarketId.toFixed(0),
                secondaryMarketId: action.secondaryMarketId.toFixed(0),
                otherAddress: action.otherAddress,
                otherAccountId: secondaryAccountId,
                data: BytesHelper_1.hexStringToBytes(action.data),
                amount: {
                    reference: action.amount.ref,
                    denomination: action.amount.denomination,
                    value: action.amount.value.times(action.amount.sign ? 1 : -1),
                },
            });
        }
        return this;
    };
    /**
     * Takes all current actions/accounts and creates an Operation struct that can then be signed and
     * later used with the SignedOperationProxy.
     */
    AccountOperation.prototype.createSignableOperation = function (options) {
        if (options === void 0) { options = {}; }
        if (this.auths.length) {
            throw new Error('Cannot create operation out of operation with auths');
        }
        if (!this.actions.length) {
            throw new Error('Cannot create operation out of operation with no actions');
        }
        function actionArgsToAction(action) {
            var secondaryAccount = (action.actionType === types_1.ActionType.Transfer ||
                action.actionType === types_1.ActionType.Trade ||
                action.actionType === types_1.ActionType.Liquidate ||
                action.actionType === types_1.ActionType.Vaporize)
                ? this.accounts[action.otherAccountId]
                : { owner: Constants_1.ADDRESSES.ZERO, number: '0' };
            return {
                actionType: Helpers_1.toNumber(action.actionType),
                primaryAccountOwner: this.accounts[action.accountId].owner,
                primaryAccountNumber: new bignumber_js_1.default(this.accounts[action.accountId].number),
                secondaryAccountOwner: secondaryAccount.owner,
                secondaryAccountNumber: new bignumber_js_1.default(secondaryAccount.number),
                primaryMarketId: new bignumber_js_1.default(action.primaryMarketId),
                secondaryMarketId: new bignumber_js_1.default(action.secondaryMarketId),
                amount: {
                    sign: action.amount.sign,
                    ref: Helpers_1.toNumber(action.amount.ref),
                    denomination: Helpers_1.toNumber(action.amount.denomination),
                    value: new bignumber_js_1.default(action.amount.value),
                },
                otherAddress: action.otherAddress,
                data: BytesHelper_1.bytesToHexString(action.data),
            };
        }
        var actions = this.actions.map(actionArgsToAction.bind(this));
        return {
            actions: actions,
            expiration: options.expiration || Constants_1.INTEGERS.ZERO,
            salt: options.salt || Constants_1.INTEGERS.ZERO,
            sender: options.sender || Constants_1.ADDRESSES.ZERO,
            signer: options.signer || this.accounts[0].owner,
        };
    };
    /**
     * Commits the operation to the chain by sending a transaction.
     */
    AccountOperation.prototype.commit = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var method;
            return __generator(this, function (_a) {
                if (this.committed) {
                    throw new Error('Operation already committed');
                }
                if (this.actions.length === 0) {
                    throw new Error('No actions have been added to operation');
                }
                if (options && options.confirmationType !== types_1.ConfirmationType.Simulate) {
                    this.committed = true;
                }
                try {
                    method = void 0;
                    switch (this.proxy) {
                        case types_1.ProxyType.None:
                            method = this.contracts.soloMargin.methods.operate(this.accounts, this.actions);
                            break;
                        case types_1.ProxyType.Payable:
                            method = this.contracts.payableProxy.methods.operate(this.accounts, this.actions, this.sendEthTo || (options && options.from) || this.contracts.payableProxy.options.from);
                            break;
                        case types_1.ProxyType.Signed:
                            method = this.contracts.signedOperationProxy.methods.operate(this.accounts, this.actions, this.generateAuthData());
                            break;
                        default:
                            throw new Error("Invalid proxy type: " + this.proxy);
                    }
                    return [2 /*return*/, this.contracts.callContractFunction(method, options)];
                }
                catch (error) {
                    this.committed = false;
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    // ============ Private Helper Functions ============
    /**
     * Internal logic for filling limit orders (either signed or pre-approved orders)
     */
    AccountOperation.prototype.fillLimitOrderInternal = function (primaryAccountOwner, primaryAccountNumber, order, weiAmount, denotedInMakerAmount, isSignedOrder) {
        var dataString = isSignedOrder
            ? this.limitOrders.signedOrderToBytes(order)
            : this.limitOrders.unsignedOrderToBytes(order);
        var amount = weiAmount.abs().times(denotedInMakerAmount ? -1 : 1);
        return this.trade({
            primaryAccountOwner: primaryAccountOwner,
            primaryAccountId: primaryAccountNumber,
            autoTrader: this.contracts.limitOrders.options.address,
            inputMarketId: denotedInMakerAmount ? order.makerMarket : order.takerMarket,
            outputMarketId: denotedInMakerAmount ? order.takerMarket : order.makerMarket,
            otherAccountOwner: order.makerAccountOwner,
            otherAccountId: order.makerAccountNumber,
            amount: {
                denomination: types_1.AmountDenomination.Wei,
                reference: types_1.AmountReference.Delta,
                value: amount,
            },
            data: BytesHelper_1.hexStringToBytes(dataString),
        });
    };
    /**
     * Internal logic for filling stop-limit orders (either signed or pre-approved orders)
     */
    AccountOperation.prototype.fillStopLimitOrderInternal = function (primaryAccountOwner, primaryAccountNumber, order, amount, denotedInMakerAmount, isSignedOrder) {
        var dataString = isSignedOrder
            ? this.stopLimitOrders.signedOrderToBytes(order)
            : this.stopLimitOrders.unsignedOrderToBytes(order);
        return this.trade({
            amount: amount,
            primaryAccountOwner: primaryAccountOwner,
            primaryAccountId: primaryAccountNumber,
            autoTrader: this.contracts.stopLimitOrders.options.address,
            inputMarketId: denotedInMakerAmount ? order.makerMarket : order.takerMarket,
            outputMarketId: denotedInMakerAmount ? order.takerMarket : order.makerMarket,
            otherAccountOwner: order.makerAccountOwner,
            otherAccountId: order.makerAccountNumber,
            data: BytesHelper_1.hexStringToBytes(dataString),
        });
    };
    AccountOperation.prototype.exchange = function (exchange, actionType) {
        var _a = this.orderMapper.mapOrder(exchange.order), bytes = _a.bytes, exchangeWrapperAddress = _a.exchangeWrapperAddress;
        var _b = __read(actionType === types_1.ActionType.Buy ?
            [exchange.makerMarketId, exchange.takerMarketId] :
            [exchange.takerMarketId, exchange.makerMarketId], 2), primaryMarketId = _b[0], secondaryMarketId = _b[1];
        var orderData = bytes.map(function (a) { return [a]; });
        this.addActionArgs(exchange, {
            actionType: actionType,
            amount: exchange.amount,
            otherAddress: exchangeWrapperAddress,
            data: orderData,
            primaryMarketId: primaryMarketId.toFixed(0),
            secondaryMarketId: secondaryMarketId.toFixed(0),
        });
        return this;
    };
    AccountOperation.prototype.addActionArgs = function (action, args) {
        if (this.committed) {
            throw new Error('Operation already committed');
        }
        var amount = args.amount ? {
            sign: !args.amount.value.isNegative(),
            denomination: args.amount.denomination,
            ref: args.amount.reference,
            value: args.amount.value.abs().toFixed(0),
        } : {
            sign: false,
            denomination: 0,
            ref: 0,
            value: 0,
        };
        var actionArgs = {
            amount: amount,
            accountId: this.getPrimaryAccountId(action),
            actionType: args.actionType,
            primaryMarketId: args.primaryMarketId || '0',
            secondaryMarketId: args.secondaryMarketId || '0',
            otherAddress: args.otherAddress || Constants_1.ADDRESSES.ZERO,
            otherAccountId: args.otherAccountId || '0',
            data: args.data || [],
        };
        this.actions.push(actionArgs);
    };
    AccountOperation.prototype.getPrimaryAccountId = function (operation) {
        return this.getAccountId(operation.primaryAccountOwner, operation.primaryAccountId);
    };
    AccountOperation.prototype.getAccountId = function (accountOwner, accountNumber) {
        var accountInfo = {
            owner: accountOwner,
            number: accountNumber.toFixed(0),
        };
        var correctIndex = function (i) {
            return (BytesHelper_1.addressesAreEqual(i.owner, accountInfo.owner) && i.number === accountInfo.number);
        };
        var index = this.accounts.findIndex(correctIndex);
        if (index >= 0) {
            return index;
        }
        this.accounts.push(accountInfo);
        return this.accounts.length - 1;
    };
    AccountOperation.prototype.generateAuthData = function () {
        var actionIndex = Constants_1.INTEGERS.ZERO;
        var result = [];
        var emptyAuth = {
            numActions: '0',
            header: {
                expiration: '0',
                salt: '0',
                sender: Constants_1.ADDRESSES.ZERO,
                signer: Constants_1.ADDRESSES.ZERO,
            },
            signature: [],
        };
        // for each signed auth
        for (var i = 0; i < this.auths.length; i += 1) {
            var auth = this.auths[i];
            // if empty auth needed, push it
            if (auth.startIndex.gt(actionIndex)) {
                result.push(__assign(__assign({}, emptyAuth), { numActions: auth.startIndex.minus(actionIndex).toFixed(0) }));
            }
            // push this auth
            result.push({
                numActions: auth.numActions.toFixed(0),
                header: {
                    expiration: auth.expiration.toFixed(0),
                    salt: auth.salt.toFixed(0),
                    sender: auth.sender,
                    signer: auth.signer,
                },
                signature: BytesHelper_1.toBytes(auth.typedSignature),
            });
            // update the action index
            actionIndex = auth.startIndex.plus(auth.numActions);
        }
        // push a final empty auth if necessary
        if (actionIndex.lt(this.actions.length)) {
            result.push(__assign(__assign({}, emptyAuth), { numActions: new bignumber_js_1.default(this.actions.length).minus(actionIndex).toFixed(0) }));
        }
        return result;
    };
    return AccountOperation;
}());
exports.AccountOperation = AccountOperation;
//# sourceMappingURL=AccountOperation.js.map