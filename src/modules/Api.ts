import { default as axios } from 'axios';
import BigNumber from 'bignumber.js';
import queryString from 'query-string';
import {
  LimitOrder,
  address,
  Integer,
  SigningMethod,
  ApiOrderQueryV2,
  ApiOrderV2,
  ApiOrder,
  ApiAccount,
  ApiFillQueryV2,
  ApiFillV2,
  ApiFill,
  ApiTradeQueryV2,
  ApiTradeV2,
  ApiTrade,
  ApiMarket,
  SignedLimitOrder,
  ApiOrderOnOrderbook,
  ApiMarketName,
  SignedStopLimitOrder,
  StopLimitOrder,
  CanonicalOrder,
  ApiSide,
  MarketId,
  BigNumberable,
  SignedCanonicalOrder,
  ApiMarketMessageV2,
} from '../types';
import { LimitOrders } from './LimitOrders';
import { StopLimitOrders } from './StopLimitOrders';
import { CanonicalOrders } from './CanonicalOrders';

const FOUR_WEEKS_IN_SECONDS = 60 * 60 * 24 * 28;
const TAKER_ACCOUNT_OWNER = '0xf809e07870dca762B9536d61A4fBEF1a17178092';
const TAKER_ACCOUNT_NUMBER = new BigNumber(0);
const DEFAULT_API_ENDPOINT = 'https://api.dydx.exchange';
const DEFAULT_API_TIMEOUT = 10000;

export class Api {
  private endpoint: String;
  private limitOrders: LimitOrders;
  private stopLimitOrders: StopLimitOrders;
  private canonicalOrders: CanonicalOrders;
  private timeout: number;

  constructor(
    limitOrders: LimitOrders,
    stopLimitOrders: StopLimitOrders,
    canonicalOrders: CanonicalOrders,
    endpoint: string = DEFAULT_API_ENDPOINT,
    timeout: number = DEFAULT_API_TIMEOUT,
  ) {
    this.endpoint = endpoint;
    this.limitOrders = limitOrders;
    this.stopLimitOrders = stopLimitOrders;
    this.canonicalOrders = canonicalOrders;
    this.timeout = timeout;
  }

  public async placeOrder({
    makerAccountOwner,
    makerMarket,
    takerMarket,
    makerAmount,
    takerAmount,
    makerAccountNumber = new BigNumber(0),
    expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
    fillOrKill = false,
    postOnly = false,
    triggerPrice,
    signedTriggerPrice,
    decreaseOnly,
    clientId,
    cancelAmountOnRevert,
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
    fillOrKill: boolean,
    postOnly: boolean,
    triggerPrice?: Integer,
    signedTriggerPrice?: Integer,
    decreaseOnly?: boolean,
    clientId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    let order: SignedLimitOrder | SignedStopLimitOrder;
    if (triggerPrice) {
      order = await this.createStopLimitOrder({
        makerAccountOwner,
        makerMarket,
        takerMarket,
        makerAmount,
        takerAmount,
        makerAccountNumber,
        expiration,
        decreaseOnly,
        triggerPrice: signedTriggerPrice,
      });
    } else {
      order = await this.createOrder({
        makerAccountOwner,
        makerMarket,
        takerMarket,
        makerAmount,
        takerAmount,
        makerAccountNumber,
        expiration,
      });
    }
    return this.submitOrder({
      order,
      fillOrKill,
      postOnly,
      clientId,
      triggerPrice,
      cancelAmountOnRevert,
    });
  }

  public async replaceOrder({
    makerAccountOwner,
    makerMarket,
    takerMarket,
    makerAmount,
    takerAmount,
    makerAccountNumber = new BigNumber(0),
    expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
    fillOrKill = false,
    postOnly = false,
    cancelId,
    triggerPrice,
    signedTriggerPrice,
    decreaseOnly,
    clientId,
    cancelAmountOnRevert,
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
    fillOrKill: boolean,
    postOnly: boolean,
    cancelId: string,
    triggerPrice?: Integer,
    signedTriggerPrice?: Integer,
    decreaseOnly?: boolean,
    clientId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    let order: SignedLimitOrder | SignedStopLimitOrder;
    if (triggerPrice) {
      order = await this.createStopLimitOrder({
        makerAccountOwner,
        makerMarket,
        takerMarket,
        makerAmount,
        takerAmount,
        makerAccountNumber,
        expiration,
        decreaseOnly,
        triggerPrice: signedTriggerPrice,
      });
    } else {
      order = await this.createOrder({
        makerAccountOwner,
        makerMarket,
        takerMarket,
        makerAmount,
        takerAmount,
        makerAccountNumber,
        expiration,
      });
    }
    return this.submitReplaceOrder({
      order,
      fillOrKill,
      postOnly,
      cancelId,
      clientId,
      triggerPrice,
      cancelAmountOnRevert,
    });
  }

  public async placeCanonicalOrder({
    order: {
      side,
      market,
      amount,
      price,
      makerAccountOwner,
      expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
      limitFee,
    },
    fillOrKill,
    postOnly,
    clientId,
    cancelId,
    cancelAmountOnRevert,
  }: {
    order: {
      side: ApiSide,
      market: ApiMarketName,
      amount: BigNumberable,
      price: BigNumberable,
      makerAccountOwner: address,
      expiration: BigNumberable,
      limitFee?: BigNumberable,
    },
    fillOrKill?: boolean,
    postOnly?: boolean,
    clientId?: string,
    cancelId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    const order: SignedCanonicalOrder = await this.createCanonicalOrder({
      side,
      market,
      amount,
      price,
      makerAccountOwner,
      expiration,
      limitFee,
      postOnly,
    });

    return this.submitCanonicalOrder({
      order,
      fillOrKill,
      postOnly,
      cancelId,
      clientId,
      cancelAmountOnRevert,
    });
  }

  /**
   * Creates but does not place a signed canonicalOrder
   */
  async createCanonicalOrder({
    side,
    market,
    amount,
    price,
    makerAccountOwner,
    expiration,
    limitFee,
    postOnly,
  }: {
    side: ApiSide,
    market: ApiMarketName,
    amount: BigNumberable,
    price: BigNumberable,
    makerAccountOwner: address,
    expiration: BigNumberable,
    limitFee?: BigNumberable,
    postOnly?: boolean,
  }): Promise<SignedCanonicalOrder> {
    if (!Object.values(ApiSide).includes(side)) {
      throw new Error(`side: ${side} is invalid`);
    }
    if (!Object.values(ApiMarketName).includes(market)) {
      throw new Error(`market: ${market} is invalid`);
    }

    const amountNumber: BigNumber = new BigNumber(amount);
    const isTaker: boolean = !postOnly;
    const markets: string[] = market.split('-');
    const baseMarket: BigNumber = MarketId[markets[0]];
    const limitFeeNumber: BigNumber = limitFee
      ? new BigNumber(limitFee)
      : this.canonicalOrders.getFeeForOrder(baseMarket, amountNumber, isTaker);

    const realExpiration: BigNumber = getRealExpiration(expiration);
    const order: CanonicalOrder = {
      baseMarket,
      makerAccountOwner,
      quoteMarket: MarketId[markets[1]],
      isBuy: side === ApiSide.BUY,
      isDecreaseOnly: false,
      amount: amountNumber,
      limitPrice: new BigNumber(price),
      triggerPrice: new BigNumber('0'),
      limitFee: limitFeeNumber,
      makerAccountNumber: new BigNumber('0'),
      expiration: realExpiration,
      salt: generatePseudoRandom256BitNumber(),
    };

    const typedSignature: string = await this.canonicalOrders.signOrder(
      order,
      SigningMethod.Hash,
    );

    return {
      ...order,
      typedSignature,
    };
  }

  /**
   * Submits an already signed canonicalOrder
   */
  public async submitCanonicalOrder({
    order,
    fillOrKill = false,
    postOnly = false,
    cancelId,
    clientId,
    cancelAmountOnRevert,
  }: {
    order: SignedCanonicalOrder,
    fillOrKill: boolean,
    postOnly: boolean,
    cancelId: string,
    clientId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    const jsonOrder = jsonifyCanonicalOrder(order);

    const data: any = {
      fillOrKill,
      postOnly,
      clientId,
      cancelId,
      cancelAmountOnRevert,
      order: jsonOrder,
    };

    const response = await axios({
      data,
      method: 'post',
      url: `${this.endpoint}/v2/orders`,
      timeout: this.timeout,
    });

    return response.data;
  }

  /**
   * Submits an already signed replaceOrder
   */
  public async submitReplaceOrder({
    order,
    fillOrKill = false,
    postOnly = false,
    cancelId,
    triggerPrice,
    clientId,
    cancelAmountOnRevert,
  }: {
    order: SignedLimitOrder,
    fillOrKill: boolean,
    postOnly: boolean,
    cancelId: string,
    triggerPrice?: Integer,
    clientId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    const jsonOrder = jsonifyOrder(order);

    const data: any = {
      cancelId,
      postOnly,
      cancelAmountOnRevert,
      order: jsonOrder,
      fillOrKill: !!fillOrKill,
    };
    if (triggerPrice) {
      data.triggerPrice = triggerPrice;
    }
    if (clientId) {
      data.clientId = clientId;
    }

    const response = await axios({
      data,
      method: 'post',
      url: `${this.endpoint}/v1/dex/orders/replace`,
      timeout: this.timeout,
    });

    return response.data;
  }

  /**
   * Creates, but does not place a signed order
   */
  public async createOrder({
    makerAccountOwner,
    makerMarket,
    takerMarket,
    makerAmount,
    takerAmount,
    makerAccountNumber = new BigNumber(0),
    expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
  }): Promise<SignedLimitOrder> {
    const realExpiration: BigNumber = getRealExpiration(expiration);
    const order: LimitOrder = {
      makerAccountOwner,
      makerAccountNumber: new BigNumber(makerAccountNumber),
      makerMarket: new BigNumber(makerMarket),
      takerMarket: new BigNumber(takerMarket),
      makerAmount: new BigNumber(makerAmount),
      takerAmount: new BigNumber(takerAmount),
      expiration: realExpiration,
      takerAccountOwner: TAKER_ACCOUNT_OWNER,
      takerAccountNumber: TAKER_ACCOUNT_NUMBER,
      salt: generatePseudoRandom256BitNumber(),
    };
    const typedSignature: string = await this.limitOrders.signOrder(
      order,
      SigningMethod.Hash,
    );

    return {
      ...order,
      typedSignature,
    };
  }

  /**
   * Creates, but does not place a signed order
   */
  public async createStopLimitOrder({
    makerAccountOwner,
    makerMarket,
    takerMarket,
    makerAmount,
    takerAmount,
    makerAccountNumber = new BigNumber(0),
    expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
    decreaseOnly,
    triggerPrice,
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
    decreaseOnly: boolean,
    triggerPrice: Integer,
  }): Promise<SignedStopLimitOrder> {
    const realExpiration: BigNumber = getRealExpiration(expiration);
    const order: StopLimitOrder = {
      makerAccountOwner,
      decreaseOnly,
      makerAccountNumber: new BigNumber(makerAccountNumber),
      makerMarket: new BigNumber(makerMarket),
      takerMarket: new BigNumber(takerMarket),
      makerAmount: new BigNumber(makerAmount),
      takerAmount: new BigNumber(takerAmount),
      expiration: realExpiration,
      takerAccountOwner: TAKER_ACCOUNT_OWNER,
      takerAccountNumber: TAKER_ACCOUNT_NUMBER,
      salt: generatePseudoRandom256BitNumber(),
      triggerPrice: new BigNumber(triggerPrice),
    };

    const typedSignature: string = await this.stopLimitOrders.signOrder(
      order,
      SigningMethod.Hash,
    );

    return {
      ...order,
      typedSignature,
    };
  }

  /**
   * Submits an already signed order
   */
  public async submitOrder({
    order,
    fillOrKill = false,
    postOnly = false,
    triggerPrice,
    clientId,
    cancelAmountOnRevert,
  }: {
    order: SignedLimitOrder | SignedStopLimitOrder,
    fillOrKill: boolean,
    postOnly: boolean,
    triggerPrice?: Integer,
    clientId?: string,
    cancelAmountOnRevert?: boolean,
  }): Promise<{ order: ApiOrder }> {
    const jsonOrder = jsonifyOrder(order);

    const data: any = {
      postOnly,
      cancelAmountOnRevert,
      order: jsonOrder,
      fillOrKill: !!fillOrKill,
    };
    if (triggerPrice) {
      data.triggerPrice = triggerPrice;
    }
    if (clientId) {
      data.clientId = clientId;
    }

    const response = await axios({
      data,
      method: 'post',
      url: `${this.endpoint}/v1/dex/orders`,
      timeout: this.timeout,
    });

    return response.data;
  }

  public async cancelOrder({
    orderId,
    makerAccountOwner,
  }: {
    orderId: string,
    makerAccountOwner: address,
  }): Promise<{ order: ApiOrder }> {
    const signature = await this.limitOrders.signCancelOrderByHash(
      orderId,
      makerAccountOwner,
      SigningMethod.Hash,
    );

    const response = await axios({
      url: `${this.endpoint}/v1/dex/orders/${orderId}`,
      method: 'delete',
      headers: {
        authorization: `Bearer ${signature}`,
      },
      timeout: this.timeout,
    });

    return response.data;
  }

  public async cancelOrderV2({
    orderId,
    makerAccountOwner,
  }: {
    orderId: string,
    makerAccountOwner: address,
  }): Promise<{ order: ApiOrder }> {
    const signature = await this.canonicalOrders.signCancelOrderByHash(
      orderId,
      makerAccountOwner,
      SigningMethod.Hash,
    );

    const response = await axios({
      url: `${this.endpoint}/v2/orders/${orderId}`,
      method: 'delete',
      headers: {
        authorization: `Bearer ${signature}`,
      },
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getOrdersV2({
    accountOwner,
    accountNumber,
    side,
    status,
    orderType,
    market,
    limit,
    startingBefore,
  }: ApiOrderQueryV2): Promise<{ orders: ApiOrderV2[] }> {
    const queryObj: any = {
      side,
      orderType,
      limit,
      market,
      status,
      accountOwner,
      accountNumber: accountNumber && new BigNumber(accountNumber).toFixed(0),
      startingBefore: startingBefore && startingBefore.toISOString(),
    };

    const query: string = queryString.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });
    const response = await axios({
      url: `${this.endpoint}/v2/orders?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getOrders({
    startingBefore,
    limit,
    pairs,
    makerAccountOwner,
    makerAccountNumber,
    status,
  }: {
    startingBefore?: Date,
    limit: number,
    pairs?: string[],
    makerAccountNumber?: Integer | string,
    makerAccountOwner?: address,
    status?: string[],
  }): Promise<{ orders: ApiOrder[] }> {
    const queryObj: any = {};

    if (startingBefore) {
      queryObj.startingBefore = startingBefore.toISOString();
    }
    if (limit) {
      queryObj.limit = limit;
    }
    if (pairs) {
      queryObj.pairs = pairs.join();
    }
    if (status) {
      queryObj.status = status.join();
    }
    if (makerAccountOwner) {
      queryObj.makerAccountOwner = makerAccountOwner;

      if (makerAccountNumber) {
        queryObj.makerAccountNumber = new BigNumber(makerAccountNumber).toFixed(0);
      } else {
        queryObj.makerAccountNumber = '0';
      }
    }

    const query: string = queryString.stringify(queryObj);

    const response = await axios({
      url: `${this.endpoint}/v1/dex/orders${query.length > 0 ? '?' : ''}${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getOrderV2({
    id,
  }: {
    id: string,
  }): Promise<{ order: ApiOrderV2 }> {
    const response = await axios({
      url: `${this.endpoint}/v2/orders/${id}`,
      method: 'get',
      timeout: this.timeout,
    });
    return response.data;
  }

  public async getMarketV2({
    market,
  }: {
    market: string,
  }): Promise<{ market: ApiMarketMessageV2 }> {
    const response = await axios({
      url: `${this.endpoint}/v2/markets/${market}`,
      method: 'get',
      timeout: this.timeout,
    });
    return response.data;
  }

  public async getMarketsV2():
    Promise<{ markets: { [market: string]: ApiMarketMessageV2 } }> {
    const response = await axios({
      url: `${this.endpoint}/v2/markets`,
      method: 'get',
      timeout: this.timeout,
    });
    return response.data;
  }

  public async getOrder({
    id,
  }: {
    id: string,
  }): Promise<{ order: ApiOrder }> {
    const response = await axios({
      url: `${this.endpoint}/v1/dex/orders/${id}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getFillsV2({
    orderId,
    side,
    market,
    transactionHash,
    accountOwner,
    accountNumber,
    startingBefore,
    limit,
  }: ApiFillQueryV2): Promise<{ fills: ApiFillV2[] }> {
    const queryObj: any = {
      orderId,
      side,
      limit,
      market,
      transactionHash,
      accountOwner,
      accountNumber: accountNumber && new BigNumber(accountNumber).toFixed(0),
      startingBefore: startingBefore && startingBefore.toISOString(),
    };

    const query: string = queryString.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });

    const response = await axios({
      url: `${this.endpoint}/v2/fills?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getFills({
    makerAccountOwner,
    startingBefore,
    limit,
    pairs,
    makerAccountNumber,
  }: {
    makerAccountOwner?: address,
    startingBefore?: Date,
    limit?: number,
    pairs?: string[],
    makerAccountNumber?: Integer | string,
  }): Promise<{ fills: ApiFill[] }> {
    const queryObj: any = { makerAccountOwner };

    if (startingBefore) {
      queryObj.startingBefore = startingBefore.toISOString();
    }
    if (limit) {
      queryObj.limit = limit;
    }
    if (pairs) {
      queryObj.pairs = pairs.join();
    }
    if (makerAccountNumber) {
      queryObj.makerAccountNumber = new BigNumber(makerAccountNumber).toFixed(0);
    } else {
      queryObj.makerAccountNumber = '0';
    }

    const query: string = queryString.stringify(queryObj);

    const response = await axios({
      url: `${this.endpoint}/v1/dex/fills?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getTradesV2({
    orderId,
    side,
    market,
    transactionHash,
    accountOwner,
    accountNumber,
    startingBefore,
    limit,
  }: ApiTradeQueryV2): Promise<{ trades: ApiTradeV2[] }> {
    const queryObj: any = {
      orderId,
      side,
      limit,
      market,
      transactionHash,
      accountOwner,
      accountNumber: accountNumber && new BigNumber(accountNumber).toFixed(0),
      startingBefore: startingBefore && startingBefore.toISOString(),
    };

    const query: string = queryString.stringify(queryObj, { skipNull: true, arrayFormat: 'comma' });

    const response = await axios({
      url: `${this.endpoint}/v2/trades?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getTrades({
    makerAccountOwner,
    startingBefore,
    limit,
    pairs,
    makerAccountNumber,
  }: {
    makerAccountOwner?: address,
    startingBefore?: Date,
    limit?: number,
    pairs?: string[],
    makerAccountNumber?: Integer | string,
  }): Promise<{ trades: ApiTrade[] }> {
    const queryObj: any = { makerAccountOwner };

    if (startingBefore) {
      queryObj.startingBefore = startingBefore.toISOString();
    }
    if (limit) {
      queryObj.limit = limit;
    }
    if (pairs) {
      queryObj.pairs = pairs.join();
    }
    if (makerAccountNumber) {
      queryObj.makerAccountNumber = new BigNumber(makerAccountNumber).toFixed(0);
    } else {
      queryObj.makerAccountNumber = '0';
    }

    const query: string = queryString.stringify(queryObj);

    const response = await axios({
      url: `${this.endpoint}/v1/dex/trades?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getAccountBalances({
    accountOwner,
    accountNumber = new BigNumber(0),
  }: {
    accountOwner: address,
    accountNumber: Integer | string,
  }): Promise<ApiAccount> {
    const numberStr = new BigNumber(accountNumber).toFixed(0);

    const response = await axios({
      url: `${this.endpoint}/v1/accounts/${accountOwner}?number=${numberStr}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getOrderbook({
    pair,
    minSize,
    limit,
    offset,
  }: {
    pair: string,
    minSize?: Integer | string,
    limit?: number,
    offset?: number,
  }): Promise<{ orders: ApiOrder[] }> {
    const queryObj: any = {};

    if (pair) {
      queryObj.pairs = pair;
    }
    if (limit) {
      queryObj.limit = limit;
    }
    if (offset) {
      queryObj.offset = offset;
    }
    if (minSize) {
      queryObj.minSize = new BigNumber(minSize).toFixed(0);
    }

    const query: string = queryString.stringify(queryObj);

    const response = await axios({
      url: `${this.endpoint}/v1/dex/orders?${query}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getOrderbookV2({
    market,
  }: {
    market: ApiMarketName,
  }): Promise<{ bids: ApiOrderOnOrderbook[], asks: ApiOrderOnOrderbook[] }> {
    const response = await axios({
      url: `${this.endpoint}/v1/orderbook/${market}`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }

  public async getMarkets(): Promise<{ markets: ApiMarket[] }> {
    const response = await axios({
      url: `${this.endpoint}/v1/markets`,
      method: 'get',
      timeout: this.timeout,
    });

    return response.data;
  }
}

function generatePseudoRandom256BitNumber(): BigNumber {
  const MAX_DIGITS_IN_UNSIGNED_256_INT = 78;

  // BigNumber.random returns a pseudo-random number between 0 & 1 with a passed in number of
  // decimal places.
  // Source: https://mikemcl.github.io/bignumber.js/#random
  const randomNumber = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT);
  const factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 1);
  const randomNumberScaledTo256Bits = randomNumber.times(factor).integerValue();
  return randomNumberScaledTo256Bits;
}

function jsonifyOrder(order) {
  return {
    typedSignature: order.typedSignature,
    makerAccountOwner: order.makerAccountOwner,
    makerAccountNumber: order.makerAccountNumber.toFixed(0),
    takerAccountOwner: order.takerAccountOwner,
    takerAccountNumber: order.takerAccountNumber.toFixed(0),
    makerMarket: order.makerMarket.toFixed(0),
    takerMarket: order.takerMarket.toFixed(0),
    makerAmount: order.makerAmount.toFixed(0),
    takerAmount: order.takerAmount.toFixed(0),
    salt: order.salt.toFixed(0),
    expiration: order.expiration.toFixed(0),
  };
}

function jsonifyCanonicalOrder(order: SignedCanonicalOrder) {
  return {
    isBuy: order.isBuy,
    isDecreaseOnly: order.isDecreaseOnly,
    baseMarket: order.baseMarket.toFixed(0),
    quoteMarket: order.quoteMarket.toFixed(0),
    amount: order.amount.toFixed(0),
    limitPrice: order.limitPrice.toString(),
    triggerPrice: order.triggerPrice.toString(),
    limitFee: order.limitFee.toString(),
    makerAccountNumber: order.makerAccountNumber.toFixed(0),
    makerAccountOwner: order.makerAccountOwner,
    expiration: order.expiration.toFixed(0),
    typedSignature: order.typedSignature,
    salt: order.salt.toFixed(0),
  };
}

function getRealExpiration(expiration: BigNumberable): BigNumber {
  return new BigNumber(expiration).eq(0) ?
    new BigNumber(0)
    : new BigNumber(Math.round(new Date().getTime() / 1000)).plus(
      new BigNumber(expiration),
    );
}
