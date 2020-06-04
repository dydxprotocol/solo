"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Websocket = exports.Channel = void 0;
var ws_1 = __importDefault(require("ws"));
var Channel;
(function (Channel) {
    Channel["ORDERBOOK"] = "orderbook";
})(Channel = exports.Channel || (exports.Channel = {}));
var IncomingMessageType;
(function (IncomingMessageType) {
    IncomingMessageType["ERROR"] = "error";
    IncomingMessageType["CONNECTED"] = "connected";
    IncomingMessageType["SUBSCRIBED"] = "subscribed";
    IncomingMessageType["CHANNEL_DATA"] = "channel_data";
})(IncomingMessageType || (IncomingMessageType = {}));
var OutgoingMessageType;
(function (OutgoingMessageType) {
    OutgoingMessageType["SUBSCRIBE"] = "subscribe";
})(OutgoingMessageType || (OutgoingMessageType = {}));
var DEFAULT_WS_ENDPOINT = 'wss://api.dydx.exchange/v1/ws';
var DEFAULT_TIMEOUT_MS = 10000;
var Websocket = /** @class */ (function () {
    function Websocket(timeout, endpoint, wsOrigin) {
        if (timeout === void 0) { timeout = DEFAULT_TIMEOUT_MS; }
        if (endpoint === void 0) { endpoint = DEFAULT_WS_ENDPOINT; }
        this.wsOrigin = wsOrigin;
        this.timeout = timeout;
        this.endpoint = endpoint;
    }
    Websocket.prototype.connect = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.onClose, onClose = _c === void 0 ? function () { return null; } : _c, _d = _b.onError, onError = _d === void 0 ? function () { return null; } : _d;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_e) {
                if (this.ws) {
                    throw new Error('Websocket already connected');
                }
                return [2 /*return*/, this.reconnect({
                        onError: onError,
                        onClose: onClose,
                    })];
            });
        });
    };
    Websocket.prototype.reconnect = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.onClose, onClose = _c === void 0 ? function () { return null; } : _c, _d = _b.onError, onError = _d === void 0 ? function () { return null; } : _d;
        return __awaiter(this, void 0, void 0, function () {
            var options;
            var _this = this;
            return __generator(this, function (_e) {
                this.subscribedCallbacks = {};
                this.listeners = {};
                options = {};
                if (this.wsOrigin) {
                    options.origin = this.wsOrigin;
                }
                this.ws = new ws_1.default(this.endpoint, options);
                this.ws.on('close', function () {
                    _this.ws = null;
                    _this.subscribedCallbacks = {};
                    _this.listeners = {};
                    onClose();
                });
                this.ws.on('message', function (message) {
                    var parsed;
                    try {
                        parsed = JSON.parse(message);
                    }
                    catch (error) {
                        onError(new Error("Failed to parse websocket message: " + message));
                        return;
                    }
                    if (!Object.values(IncomingMessageType).includes(parsed.type)) {
                        onError(new Error("Incomming message contained no type: " + message));
                        return;
                    }
                    if (parsed.type === IncomingMessageType.ERROR) {
                        onError(new Error("Websocket threw error: " + parsed.message));
                        return;
                    }
                    if (parsed.type === IncomingMessageType.SUBSCRIBED) {
                        var subscribedMessage = parsed;
                        if (_this.subscribedCallbacks[subscribedMessage.channel]) {
                            if (_this.subscribedCallbacks[subscribedMessage.channel][subscribedMessage.id]) {
                                var callback = _this.subscribedCallbacks[subscribedMessage.channel][subscribedMessage.id];
                                delete _this.subscribedCallbacks[subscribedMessage.channel][subscribedMessage.id];
                                callback(subscribedMessage.contents);
                            }
                        }
                        return;
                    }
                    if (parsed.type === IncomingMessageType.CHANNEL_DATA) {
                        var subscribedMessage = parsed;
                        if (_this.listeners[subscribedMessage.channel]) {
                            var callback = _this.listeners[subscribedMessage.channel][subscribedMessage.id];
                            if (callback) {
                                callback(subscribedMessage.contents);
                            }
                        }
                        return;
                    }
                });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timeout = setTimeout(function () { return reject(new Error('Websocket connection timeout')); }, _this.timeout);
                        _this.ws.on('open', function () {
                            clearTimeout(timeout);
                            resolve();
                        });
                    })];
            });
        });
    };
    Websocket.prototype.watchOrderbook = function (_a) {
        var market = _a.market, onUpdates = _a.onUpdates;
        return __awaiter(this, void 0, void 0, function () {
            var subscribeMessage, initialResponsePromise;
            var _this = this;
            return __generator(this, function (_b) {
                if (!this.ws) {
                    throw new Error('Websocket connection not open');
                }
                subscribeMessage = {
                    type: OutgoingMessageType.SUBSCRIBE,
                    channel: Channel.ORDERBOOK,
                    id: market,
                };
                if (this.subscribedCallbacks[subscribeMessage.channel]) {
                    if (this.subscribedCallbacks[subscribeMessage.channel][subscribeMessage.id]
                        || this.listeners[subscribeMessage.channel][subscribeMessage.id]) {
                        throw new Error("Already watching orderbook market " + market);
                    }
                }
                this.listeners[subscribeMessage.channel][subscribeMessage.id] = function (contents) {
                    onUpdates(contents.updates);
                };
                initialResponsePromise = new Promise(function (resolve, reject) {
                    var timeout = setTimeout(function () { return reject(new Error("Websocket orderbook subscribe timeout: " + market)); }, _this.timeout);
                    if (!_this.subscribedCallbacks[subscribeMessage.channel]) {
                        _this.subscribedCallbacks[subscribeMessage.channel] = {};
                    }
                    _this.subscribedCallbacks[subscribeMessage.channel][subscribeMessage.id] = function (contents) {
                        clearTimeout(timeout);
                        resolve(contents);
                    };
                });
                this.ws.send(JSON.stringify(subscribeMessage));
                return [2 /*return*/, initialResponsePromise];
            });
        });
    };
    return Websocket;
}());
exports.Websocket = Websocket;
//# sourceMappingURL=Websocket.js.map