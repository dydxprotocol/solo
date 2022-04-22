/*

    Copyright 2019 Dolomite.

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
import BN from 'bn.js';
import { Tx } from 'web3/eth/types';
import {
  EventLog,
  Log,
  TransactionReceipt,
} from 'web3/types';

export type address = string;
export type Integer = BigNumber;
export type Decimal = BigNumber;
export type BigNumberable = BigNumber | string | number;

export enum ConfirmationType {
  Hash = 0,
  Confirmed = 1,
  Both = 2,
  Simulate = 3,
}

export const MarketId = {
  WETH: new BigNumber(0),
  USDC: new BigNumber(1),
  DAI: new BigNumber(2),

  // This market number does not exist on the protocol,
  // but can be used for standard actions
  ETH: new BigNumber(-1),
};

export const Networks = {
  MATIC: 137,
  MUMBAI: 80001,
  ARBITRUM: 42161,
  ARBITRUM_RINKEBY: 421611,
};

export enum ProxyType {
  None = 'None',
  Payable = 'Payable',
  Signed = 'Sender',
}

export enum SigningMethod {
  Compatibility = 'Compatibility', // picks intelligently between UnsafeHash and Hash
  UnsafeHash = 'UnsafeHash', // raw hash signed
  Hash = 'Hash', // hash prepended according to EIP-191
  TypedData = 'TypedData', // order hashed according to EIP-712
  MetaMask = 'MetaMask', // order hashed according to EIP-712 (MetaMask-only)
  MetaMaskLatest = 'MetaMaskLatest', // ... according to latest version of EIP-712 (MetaMask-only)
  CoinbaseWallet = 'CoinbaseWallet', // ... according to latest version of EIP-712 (CoinbaseWallet)
}

export interface DolomiteMarginOptions {
  defaultAccount?: address;
  confirmationType?: ConfirmationType;
  defaultConfirmations?: number;
  autoGasMultiplier?: number;
  testing?: boolean;
  defaultGas?: number | string;
  defaultGasPrice?: number | string;
  blockGasLimit?: number;
  accounts?: EthereumAccount[];
  apiEndpoint?: string;
  apiTimeout?: number;
  ethereumNodeTimeout?: number;
  wsOrigin?: string;
  wsEndpoint?: string;
  wsTimeout?: number;
}

export interface EthereumAccount {
  address?: string;
  privateKey: string;
}

export interface ContractCallOptions extends Tx {
  confirmations?: number;
  confirmationType?: ConfirmationType;
  autoGasMultiplier?: number;
}

export interface ContractConstantCallOptions extends Tx {
  blockNumber?: number;
}

export interface AccountOperationOptions {
  proxy?: ProxyType;
  sendEthTo?: address;
}

export interface LogParsingOptions {
  skipOperationLogs?: boolean;
  skipAdminLogs?: boolean;
  skipPermissionLogs?: boolean;
  skipSignedOperationProxyLogs?: boolean;
  skipExpiryLogs?: boolean;
}

export interface TxResult {
  transactionHash?: string;
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
  gasEstimate?: number;
  gas?: number;
}

export enum AmountDenomination {
  Actual = 0,
  Principal = 1,
  Wei = 0,
  Par = 1,
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

export enum OrderType {
}

export interface Order {
  type: OrderType | string; // the "| string" needs to be here to allow it to be overridden in the Test module
  exchangeWrapperAddress: string;
}

export interface TestOrder extends Order {
  originator: string;
  makerToken: string;
  takerToken: string;
  makerAmount: BigNumber | BN;
  takerAmount: BigNumber | BN;
  allegedTakerAmount: BigNumber | BN;
  desiredMakerAmount: BigNumber | BN;
}

export interface Exchange extends AccountAction {
  takerMarketId: Integer;
  makerMarketId: Integer;
  order: Order;
  amount: Amount;
}

export interface Buy extends Exchange {
}

export interface Sell extends Exchange {
}

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

export interface ExpiryArg {
  accountOwner: address;
  accountId: Integer;
  marketId: Integer;
  timeDelta: Integer;
  forceUpdate: boolean;
}

export interface SetExpiry extends AccountAction {
  expiryArgs: ExpiryArg[];
}

export interface Call extends AccountAction {
  callee: address;
  data: (string | number[])[];
}

export interface AccountInfo {
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

export interface TotalPar {
  borrow: Integer;
  supply: Integer;
}

export interface Market {
  token: address;
  totalPar: TotalPar;
  index: Index;
  priceOracle: address;
  interestSetter: address;
  marginPremium: Decimal;
  spreadPremium: Decimal;
  maxWei: Integer;
  isClosing: boolean;
}

export interface MarketWithInfo {
  market: Market;
  currentIndex: Index;
  currentPrice: Integer;
  currentInterestRate: Decimal;
}

export interface RiskLimits {
  marginRatioMax: Decimal;
  liquidationSpreadMax: Decimal;
  earningsRateMax: Decimal;
  marginPremiumMax: Decimal;
  spreadPremiumMax: Decimal;
  minBorrowedValueMax: Integer;
}

export interface RiskParams {
  marginRatio: Decimal;
  liquidationSpread: Decimal;
  earningsRate: Decimal;
  minBorrowedValue: Integer;
  accountMaxNumberOfMarketsWithBalances: Integer;
}

export interface Balance {
  marketId: Integer;
  tokenAddress: address;
  par: Integer;
  wei: Integer;
}

export interface Values {
  supply: Integer;
  borrow: Integer;
}

export interface BalanceUpdate {
  deltaWei: Integer;
  newPar: Integer;
}

// ============ Expiry ============

export interface SetApprovalForExpiry extends AccountAction {
  sender: address;
  minTimeDelta: Integer;
}

export enum ExpiryCallFunctionType {
  SetExpiry = 0,
  SetApproval = 1,
}

// ============ Sender Proxy ============

export interface OperationAuthorization {
  startIndex: Integer;
  numActions: Integer;
  expiration: Integer;
  salt: Integer;
  sender: address;
  signer: address;
  typedSignature: string;
}

export interface AssetAmount {
  sign: boolean;
  denomination: AmountDenomination;
  ref: AmountReference;
  value: Integer;
}

export interface Action {
  actionType: ActionType;
  primaryAccountOwner: address;
  primaryAccountNumber: Integer;
  secondaryAccountOwner: address;
  secondaryAccountNumber: Integer;
  primaryMarketId: Integer;
  secondaryMarketId: Integer;
  amount: AssetAmount;
  otherAddress: address;
  data: string;
}

export interface Operation {
  actions: Action[];
  expiration: Integer;
  salt: Integer;
  sender: address;
  signer: address;
}

export interface SignedOperation extends Operation {
  typedSignature: string;
}
