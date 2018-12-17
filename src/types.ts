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
  Exchange = 2,
  Liquidate = 3,
  SetExpiry = 4,
}

export enum AmountIntention {
  Deposit = 0,
  Withdraw = 1,
}

export interface Amount {
  value: BN;
  denomination: AmountDenomination;
  reference: AmountReference;
  intent?: AmountIntention;
}

export interface AccountOperation {
  amount: Amount;
}

export interface Deposit extends AccountOperation {
  asset: string;
}

export interface Withdraw extends AccountOperation {
  asset: string;
}

export interface Exchange extends AccountOperation {
  withdrawAsset: string;
  depositAsset: string;
  order: Order;
}

export interface Liquidate extends AccountOperation {
  withdrawAsset: string;
  depositAsset: string;
  liquidTrader: string;
  liquidAccount: BN;
}

export interface TransactionArgs {
  transactionType: number | string;
  amount: {
    sign: boolean;
    intent: number | string;
    denom: number | string;
    ref: number | string;
    value: number | string;
  };
  depositAssetId: number | string;
  withdrawAssetId: number | string;
  exchangeWrapperOrLiquidTrader: string;
  liquidAccount: number | string;
  orderData: (string | number[])[];
}
