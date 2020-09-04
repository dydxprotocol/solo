import { default as axios } from 'axios';
import BigNumber from 'bignumber.js';
import queryString from 'query-string';
import {
  address,
  Integer,
  SigningMethod,
  ApiOrderQueryV2,
  ApiOrderV2,
  ApiOrder,
  ApiAccount,
  ApiFillQueryV2,
  ApiFillV2,
  ApiTradeQueryV2,
  ApiTradeV2,
  ApiMarket,
  ApiOrderOnOrderbook,
  ApiMarketName,
  CanonicalOrder,
  ApiSide,
  MarketId,
  BigNumberable,
  SignedCanonicalOrder,
  ApiMarketMessageV2,
  RequestMethod,
} from '../types';
import { CanonicalOrders } from './CanonicalOrders';

import _ from 'lodash';

const FOUR_WEEKS_IN_SECONDS = 60 * 60 * 24 * 28;
const DEFAULT_API_ENDPOINT = 'https://api.dydx.exchange';
const DEFAULT_API_TIMEOUT = 10000;

export class Api {
  private endpoint: String;
  private canonicalOrders: CanonicalOrders;
  private timeout: number;

  constructor(
    canonicalOrders: CanonicalOrders,
    endpoint: string = DEFAULT_API_ENDPOINT,
    timeout: number = DEFAULT_API_TIMEOUT,
  ) {
    this.endpoint = endpoint;
    this.canonicalOrders = canonicalOrders;
    this.timeout = timeout;
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

    return this.axiosRequest({
      data,
      url: `${this.endpoint}/v2/orders`,
      method: RequestMethod.POST,
    });
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

    return this.axiosRequest({
      url: `${this.endpoint}/v2/orders/${orderId}`,
      method: RequestMethod.DELETE,
      headers: {
        authorization: `Bearer ${signature}`,
      },
    });
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

    return this.axiosRequest({
      url: `${this.endpoint}/v2/orders?${query}`,
      method: RequestMethod.GET,
    });
  }

  public async getOrderV2({
    id,
  }: {
    id: string,
  }): Promise<{ order: ApiOrderV2 }> {
    return this.axiosRequest({
      url: `${this.endpoint}/v2/orders/${id}`,
      method: RequestMethod.GET,
    });
  }

  public async getMarketV2({
    market,
  }: {
    market: string,
  }): Promise<{ market: ApiMarketMessageV2 }> {
    return this.axiosRequest({
      url: `${this.endpoint}/v2/markets/${market}`,
      method: RequestMethod.GET,
    });
  }

  public async getMarketsV2():
    Promise<{ markets: { [market: string]: ApiMarketMessageV2 } }> {
    return this.axiosRequest({
      url: `${this.endpoint}/v2/markets`,
      method: RequestMethod.GET,
    });
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

    return this.axiosRequest({
      url: `${this.endpoint}/v2/fills?${query}`,
      method: RequestMethod.GET,
    });
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

    return this.axiosRequest({
      url: `${this.endpoint}/v2/trades?${query}`,
      method: RequestMethod.GET,
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

    return this.axiosRequest({
      url: `${this.endpoint}/v1/accounts/${accountOwner}?number=${numberStr}`,
      method: RequestMethod.GET,
    });
  }

  public async getOrderbookV2({
    market,
  }: {
    market: ApiMarketName,
  }): Promise<{ bids: ApiOrderOnOrderbook[], asks: ApiOrderOnOrderbook[] }> {
    return this.axiosRequest({
      url: `${this.endpoint}/v1/orderbook/${market}`,
      method: RequestMethod.GET,
    });
  }

  public async getMarkets(): Promise<{ markets: ApiMarket[] }> {
    return this.axiosRequest({
      url: `${this.endpoint}/v1/markets`,
      method: RequestMethod.GET,
    });
  }

  private async axiosRequest(
    {
      url,
      method,
      headers,
      data,
    }: {
      url: string,
      method: RequestMethod,
      headers?: any,
      data?: any,
    }): Promise<any> {
    try {
      const response = await axios({
        url,
        method,
        headers,
        data,
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      const message = _.get(error, 'response.data.errors[0].msg') || error.message;
      const newError = new Error(message);
      newError.stack = error.stack;
      if (error.response) {
        // Include selected data from the response. Don't include the whole response, which may
        // contain circular references.
        (newError as any).response = _.pick(error.response, ['data', 'status', 'statusText']);
      }
      throw newError;
    }
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
