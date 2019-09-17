import request from 'request-promise-native';
import BigNumber from 'bignumber.js';
import queryString from 'query-string';
import { omit, isUndefined } from 'lodash';
import {
  LimitOrder,
  address,
  Integer,
  SigningMethod,
  ApiOrder,
  ApiAccount,
  ApiFill,
  ApiTrade,
  OrderType,
} from '../types';
import { LimitOrders } from './LimitOrders';

const FOUR_WEEKS_IN_SECONDS = 60 * 60 * 24 * 28;
const TAKER_ACCOUNT_OWNER = '0xf809e07870dca762B9536d61A4fBEF1a17178092';
const TAKER_ACCOUNT_NUMBER = new BigNumber(0);
const DEFAULT_API_ENDPOINT = 'https://api.dydx.exchange';

export class Api {
  private endpoint: String;
  private limitOrders: LimitOrders;

  constructor(
    limitOrders: LimitOrders,
    endpoint: string = DEFAULT_API_ENDPOINT,
  ) {
    this.endpoint = endpoint;
    this.limitOrders = limitOrders;
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

    const jsonOrder = {
      typedSignature,
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

    const body = {
      fillOrKill,
      clientId,
      order: jsonOrder,
    };

    return request({
      body: omit(body, isUndefined),
      uri: `${this.endpoint}/v1/dex/orders`,
      method: 'POST',
      json: true,
    });
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

    return request({
      uri: `${this.endpoint}/v1/dex/orders/${orderId}`,
      method: 'DELETE',
      json: true,
      headers: {
        authorization: `Bearer ${signature}`,
      },
    });
  }

  public async getOrders({
    startingBefore,
    limit,
    pairs,
    makerAccountOwner,
    makerAccountNumber,
  }: {
    startingBefore?: Date,
    limit: number,
    pairs?: string[],
    makerAccountNumber?: Integer | string,
    makerAccountOwner?: address,
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
    if (makerAccountOwner) {
      queryObj.makerAccountOwner = makerAccountOwner;

      if (makerAccountNumber) {
        queryObj.makerAccountNumber = new BigNumber(makerAccountNumber).toFixed(0);
      } else {
        queryObj.makerAccountNumber = '0';
      }
    }

    const query: string = queryString.stringify(queryObj);

    return request({
      uri: `${this.endpoint}/v1/dex/orders${query.length > 0 ? '?' : ''}${query}`,
      method: 'GET',
      json: true,
    });
  }

  public async getOrder({
    id,
  }: {
    id: string,
  }): Promise<{ order: ApiOrder }> {
    return request({
      uri: `${this.endpoint}/v1/dex/orders/${id}`,
      method: 'GET',
      json: true,
    });
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
  }): Promise<{ fills: ApiFill }> {
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

    return request({
      uri: `${this.endpoint}/v1/dex/fills?${query}`,
      method: 'GET',
      json: true,
    });
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
  }): Promise<{ trades: ApiTrade }> {
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

    return request({
      uri: `${this.endpoint}/v1/dex/trades?${query}`,
      method: 'GET',
      json: true,
    });
  }

  public async getAccountBalances({
    accountOwner,
    accountNumber = new BigNumber(0),
  }: {
    accountOwner: address,
    accountNumber: Integer | string,
  }): Promise<ApiAccount> {
    const numberStr = new BigNumber(accountNumber).toFixed(0);
    return request({
      uri: `${this.endpoint}/v1/accounts/${accountOwner}?number=${numberStr}`,
      method: 'GET',
      json: true,
    });
  }

  public async getOrderbook({
    pair,
    orderType,
    minSize,
    limit,
    offset,
  }: {
    pair: string,
    orderType: OrderType,
    minSize?: Integer | string,
    limit?: number,
    offset?: number,
  }): Promise<ApiOrder[]> {
    const queryObj: any = {};

    queryObj.orderType = orderType ? orderType : OrderType.DYDX;
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

    return request({
      uri: `${this.endpoint}/v1/orders/${pair}?${query}`,
      method: 'GET',
      json: true,
    });
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
