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

import BigNumber from 'bignumber.js';
import { Order } from '@dydxprotocol/exchange-wrappers';
import { Tx } from 'web3/eth/types';
import { TransactionReceipt, Log, EventLog } from 'web3/types';

export type address = string;
export type Integer = BigNumber;
export type Decimal = BigNumber;

export enum ConfirmationType {
  Hash = 0,
  Confirmed = 1,
  Both = 2,
}

export interface SoloOptions {
  defaultAccount?: address;
  confirmationType?: ConfirmationType;
  defaultConfirmations?: number;
  autoGasMultiplier?: number;
  testing?: boolean;
  defaultGas?: number | string;
  defaultGasPrice?: number | string;
}

export interface ContractCallOptions extends Tx {
  confirmations?: number;
  confirmationType?: ConfirmationType;
  autoGasMultiplier?: number;
}

export interface AccountOperationOptions {
  usePayableProxy?: boolean;
}

export interface TxResult {
  transactionHash: string;
  transactionIndex?: number;
  blockHash?: string;
  blockNumber?: number;
  from?: string;
  to?: string;
  contractAddress?: string;
  cumulativeGasUsed?: number;
  gasUsed?: number;
  logs?: Log[];
  events?: {
    [eventName: string]: EventLog;
  };
  status?: boolean;
  confirmation?: Promise<TransactionReceipt>;
}

export enum AmountDenomination {
  Actual = 0,
  Principal = 1,
}

export enum AmountReference {
  Delta = 0,
  Target = 1,
}

export enum ActionType {
  Deposit = 0,
  Withdraw = 1,
  Transfer = 2,
  Buy = 3,
  Sell = 4,
  Trade = 5,
  Liquidate = 6,
  Vaporize = 7,
  Call = 8,
}

export enum AccountStatus {
  Normal = 0,
  Liquidating = 1,
  Vaporizing = 2,
}

export interface Amount {
  value: Integer;
  denomination: AmountDenomination;
  reference: AmountReference;
}

export interface AccountAction {
  primaryAccountOwner: address;
  primaryAccountId: Integer;
}

interface ExternalTransfer extends AccountAction {
  marketId: Integer;
  amount: Amount;
}

export interface Deposit extends ExternalTransfer {
  from: address;
}

export interface Withdraw extends ExternalTransfer {
  to: address;
}

export interface Transfer extends AccountAction {
  marketId: Integer;
  toAccountOwner: address;
  toAccountId: Integer;
  amount: Amount;
}

export interface Exchange extends AccountAction {
  takerMarketId: Integer;
  makerMarketId: Integer;
  order: Order;
  amount: Amount;
}

export interface Buy extends Exchange {}
export interface Sell extends Exchange {}

export interface Trade extends AccountAction {
  autoTrader: address;
  inputMarketId: Integer;
  outputMarketId: Integer;
  otherAccountOwner: address;
  otherAccountId: Integer;
  amount: Amount;
  data: (string | number[])[];
}

export interface Liquidate extends AccountAction {
  liquidMarketId: Integer;
  payoutMarketId: Integer;
  liquidAccountOwner: address;
  liquidAccountId: Integer;
  amount: Amount;
}

export interface Vaporize extends AccountAction {
  vaporMarketId: Integer;
  payoutMarketId: Integer;
  vaporAccountOwner: address;
  vaporAccountId: Integer;
  amount: Amount;
}

export interface SetExpiry extends AccountAction {
  marketId: Integer;
  expiryTime: Integer;
}

export interface Call extends AccountAction {
  callee: address;
  data: (string | number[])[];
}

export interface AcctInfo {
  owner: string;
  number: number | string;
}

export interface ActionArgs {
  actionType: number | string;
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

export interface Index {
  borrow: Decimal;
  supply: Decimal;
  lastUpdate: Integer;
}

export interface MarketWithInfo {
  market: {
    token: address;
    totalPar: { borrow: Integer; supply: Integer };
    index: Index;
    priceOracle: address;
    interestSetter: address;
    isClosing: boolean;
  };
  currentIndex: Index;
  currentPrice: Integer;
  currentInterestRate: Decimal;
}

export interface Balance {
  tokenAddress: address;
  par: Integer;
  wei: Integer;
}

export interface Values {
  supply: Integer;
  borrow: Integer;
}
