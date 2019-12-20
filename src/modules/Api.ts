import { default as axios } from 'axios';
import BigNumber from 'bignumber.js';
import queryString from 'query-string';
import {
  LimitOrder,
  address,
  Integer,
  SigningMethod,
  ApiOrder,
  ApiAccount,
  ApiFill,
  ApiTrade,
  ApiMarket,
  SignedLimitOrder,
  ApiOrderOnOrderbook,
  ApiMarketName,
} from '../types';
import { LimitOrders } from './LimitOrders';

const FOUR_WEEKS_IN_SECONDS = 60 * 60 * 24 * 28;
const TAKER_ACCOUNT_OWNER = '0xf809e07870dca762B9536d61A4fBEF1a17178092';
const TAKER_ACCOUNT_NUMBER = new BigNumber(0);
const DEFAULT_API_ENDPOINT = 'https://api.dydx.exchange';
const DEFAULT_API_TIMEOUT = 10000;

export class Api {
  private endpoint: String;
  private limitOrders: LimitOrders;
  private timeout: number;

  constructor(
    limitOrders: LimitOrders,
    endpoint: string = DEFAULT_API_ENDPOINT,
    timeout: number = DEFAULT_API_TIMEOUT,
  ) {
    this.endpoint = endpoint;
    this.limitOrders = limitOrders;
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
    clientId,
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
    fillOrKill: boolean,
    clientId?: string,
  }): Promise<{ order: ApiOrder }> {
    const order: SignedLimitOrder = await this.createOrder({
      makerAccountOwner,
      makerMarket,
      takerMarket,
      makerAmount,
      takerAmount,
      makerAccountNumber,
      expiration,
    });
    return this.submitOrder({
      order,
      fillOrKill,
      clientId,
    });
  }

  /**
   * Creates, but does not place a signed order and signed cancel pair
   */
  public async replaceOrder({
    makerAccountOwner,
    makerMarket,
    takerMarket,
    makerAmount,
    takerAmount,
    makerAccountNumber = new BigNumber(0),
    expiration = new BigNumber(FOUR_WEEKS_IN_SECONDS),
    fillOrKill = false,
    cancelId,
    clientId,
  }: {
    makerAccountOwner: address,
    makerAccountNumber: Integer | string,
    makerMarket: Integer | string,
    takerMarket: Integer | string,
    makerAmount: Integer | string,
    takerAmount: Integer | string,
    expiration: Integer | string,
    fillOrKill: boolean,
    cancelId: string,
    clientId?: string,
  }): Promise<{ order: ApiOrder }> {
    const [
      order,
      cancelSignature,
    ] = await Promise.all([
      this.createOrder({
        makerAccountOwner,
        makerMarket,
        takerMarket,
        makerAmount,
        takerAmount,
        makerAccountNumber,
        expiration,
      }),
      this.limitOrders.signCancelOrderByHash(
        cancelId,
        makerAccountOwner,
        SigningMethod.Hash,
      ),
    ]);
    return this.submitReplaceOrder({
      order,
      fillOrKill,
      cancelId,
      cancelSignature,
      clientId,
    });
  }

    /**
   * Submits an already signed replaceOrder
   */
  public async submitReplaceOrder({
    order,
    fillOrKill = false,
    cancelId,
    cancelSignature,
    clientId,
  }: {
    order: SignedLimitOrder,
    fillOrKill: boolean,
    cancelId: string,
    cancelSignature: string,
    clientId?: string,
  }): Promise<{ order: ApiOrder }> {
    const jsonOrder = this.jsonifyOrder(order);

    const data: any = {
      order: jsonOrder,
    };
    if (clientId) {
      data.clientId = clientId;
    }
    data.fillOrKill = !!fillOrKill;
    data.cancelId = cancelId;
    data.cancelSignature = cancelSignature;

    const response = await axios({
      data,
      method: 'post',
      url: `${this.endpoint}/v1/dex/orders/replace`,
      timeout: this.timeout,
    });

    return response.data;
  }

  private jsonifyOrder(order) {
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
    const realExpiration = new BigNumber(expiration).eq(0) ?
      new BigNumber(0)
      : new BigNumber(Math.round(new Date().getTime() / 1000)).plus(
        new BigNumber(expiration),
      );
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
   * Submits an already signed order
   */
  public async submitOrder({
    order,
    fillOrKill = false,
    clientId,
  }: {
    order: SignedLimitOrder,
    fillOrKill: boolean,
    clientId?: string,
  }): Promise<{ order: ApiOrder }> {
    const jsonOrder = this.jsonifyOrder(order);

    const data: any = {
      order: jsonOrder,
    };
    if (clientId) {
      data.clientId = clientId;
    }
    data.fillOrKill = !!fillOrKill;

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
