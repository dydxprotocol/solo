/*

    Copyright 2018 dYdX Trading Inc.

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

import BN from 'bn.js';
import { Order } from '@dydxprotocol/exchange-wrappers';
import { Tx } from 'web3/eth/types';
import { TransactionReceipt } from 'web3/types';

export interface ContractCallOptions extends Tx {
  confirmations?: number;
}

export interface TxResult {
  transactionHash: string;
  confirmation: Promise<TransactionReceipt>;
}

export enum AmountDenomination {
  Actual = 0,
  Principal = 1,
}

export enum AmountReference {
  Delta = 0,
  Target = 1,
}

export enum TransactionType {
  Deposit = 0,
  Withdraw = 1,
  Transfer = 2,
  Buy = 3,
  Sell = 4,
  Trade = 5,
  Liquidate = 6,
  Call = 7,
}

export interface Amount {
  value: BN;
  denomination: AmountDenomination;
  reference: AmountReference;
}

export type address = string;

export interface AccountOperation {
  primaryAccountOwner: address;
  primaryAccountId: BN;
}

interface ExternalTransfer extends AccountOperation {
  marketId: BN;
  amount: Amount;
}

export interface Deposit extends ExternalTransfer {
  from: address;
}

export interface Withdraw extends ExternalTransfer {
  to: address;
}

export interface Transfer extends AccountOperation {
  marketId: BN;
  toAccountOwner: address;
  toAccountId: BN;
  amount: Amount;
}

export interface Exchange extends AccountOperation {
  takerMarketId: BN;
  makerMarketId: BN;
  order: Order;
  amount: Amount;
}

export interface Buy extends Exchange {}
export interface Sell extends Exchange {}

export interface Liquidate extends AccountOperation {
  liquidMarketId: BN;
  payoutMarketId: BN;
  liquidAccountOwner: address;
  liquidAccountId: BN;
  amount: Amount;
}

export interface SetExpiry extends AccountOperation {
  marketId: BN;
  expiryTime: BN;
}

export interface AcctInfo {
  owner: string;
  number: number | string;
}

export interface TransactionArgs {
  transactionType: number | string;
  accountId: number | string;
  amount: {
    sign: boolean;
    denomination: number | string;
    ref: number | string;
    value: number | string;
  };
  primaryMarketId: number | string;
  secondaryMarketId: number | string;
  otherAddress: string;
  otherAccountId: number | string;
  data: (string | number[])[];
}
