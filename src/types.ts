/*

    Copyright 2019 dYdX Trading Inc.

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
  Simulate = 3,
}

export const MarketId = {
  WETH: new BigNumber(0),
  SAI: new BigNumber(1),
  USDC: new BigNumber(2),
  DAI: new BigNumber(3),

  // This market number does not exist on the protocol,
  // but can be used for standard actions
  ETH: new BigNumber(-1),
};

export const Networks = {
  MAINNET: 1,
  KOVAN: 42,
};

export enum ProxyType {
  None = 'None',
  Payable = 'Payable',
  Sender = 'Sender', // Deprecated
  Signed = 'Sender',
}

export enum SigningMethod {
  Compatibility = 'Compatibility',   // picks intelligently between UnsafeHash and Hash
  UnsafeHash = 'UnsafeHash',         // raw hash signed
  Hash = 'Hash',                     // hash prepended according to EIP-191
  TypedData = 'TypedData',           // order hashed according to EIP-712
  MetaMask = 'MetaMask',             // order hashed according to EIP-712 (MetaMask-only)
  MetaMaskLatest = 'MetaMaskLatest', // ... according to latest version of EIP-712 (MetaMask-only)
  CoinbaseWallet = 'CoinbaseWallet', // ... according to latest version of EIP-712 (CoinbaseWallet)
}

export interface SoloOptions {
  defaultAccount?: address;
  confirmationType?: ConfirmationType;
  defaultConfirmations?: number;
  autoGasMultiplier?: number;
  testing?: boolean;
  defaultGas?: number | string;
  defaultGasPrice?: number | string;
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
  usePayableProxy?: boolean; // deprecated
  proxy?: ProxyType;
  sendEthTo?: address;
}

export interface LogParsingOptions {
  skipOperationLogs?: boolean;
  skipAdminLogs?: boolean;
  skipPermissionLogs?: boolean;
  skipExpiryLogs?: boolean;
  skipRefunderLogs?: boolean;
  skipLimitOrdersLogs?: boolean;
  skipSignedOperationProxyLogs?: boolean;
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

export interface ExpiryV2Arg {
  accountOwner: address;
  accountId: Integer;
  marketId: Integer;
  timeDelta: Integer;
  forceUpdate: boolean;
}

export interface SetExpiryV2 extends AccountAction {
  expiryV2Args: ExpiryV2Arg[];
}

export interface Refund extends AccountAction {
  receiverAccountOwner: address;
  receiverAccountId: Integer;
  refundMarketId: Integer;
  otherMarketId: Integer;
  wei: Integer;
}

export interface DaiMigrate extends AccountAction {
  userAccountOwner: address;
  userAccountId: Integer;
  amount: Amount;
}

export interface AccountActionWithOrder extends AccountAction {
  order: LimitOrder;
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

export interface BalanceUpdate {
  deltaWei: Integer;
  newPar: Integer;
}

// ============ Expiry ============

export interface SetExpiry extends AccountAction {
  marketId: Integer;
  expiryTime: Integer;
}

export interface ExpiryV2Arg {
  accountOwner: address;
  accountId: Integer;
  marketId: Integer;
  timeDelta: Integer;
}

export interface SetExpiryV2 extends AccountAction {
  expiryV2Args: ExpiryV2Arg[];
}

export interface SetApprovalForExpiryV2 extends AccountAction {
  sender: address;
  minTimeDelta: Integer;
}

export enum ExpiryV2CallFunctionType {
  SetExpiry = 0,
  SetApproval = 1,
}

// ============ Limit Orders ============

export interface LimitOrder {
  makerMarket: Integer;
  takerMarket: Integer;
  makerAmount: Integer;
  takerAmount: Integer;
  makerAccountOwner: address;
  makerAccountNumber: Integer;
  takerAccountOwner: address;
  takerAccountNumber: Integer;
  expiration: Integer;
  salt: Integer;
}

export interface SignedLimitOrder extends LimitOrder {
  typedSignature: string;
}

export enum LimitOrderStatus {
  Null = 0,
  Approved = 1,
  Canceled = 2,
}

export interface LimitOrderState {
  status: LimitOrderStatus;
  totalMakerFilledAmount: Integer;
}

export enum LimitOrderCallFunctionType {
  Approve = 0,
  Cancel = 1,
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

// ============ Api ============

export enum ApiOrderType {
  LIMIT_V1 = 'dydexLimitV1',
}

export enum ApiOrderStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELED = 'CANCELED',
}

export enum ApiFillStatus {
  PENDING = 'PENDING',
  REVERTED = 'REVERTED',
  CONFIRMED = 'CONFIRMED',
}

export enum ApiMarketName {
  WETH_DAI = 'WETH-DAI',
  WETH_USDC = 'WETH-USDC',
  DAI_USDC = 'DAI-USDC',
}

export interface ApiOrder extends ApiModel {
  id: string;
  uuid: string;
  rawData: string;
  orderType: ApiOrderType;
  pairUuid: string;
  makerAccountOwner: string;
  makerAccountNumber: string;
  makerAmount: string;
  takerAmount: string;
  makerAmountRemaining: string;
  takerAmountRemaining: string;
  price: string;
  fillOrKill: boolean;
  status: ApiOrderStatus;
  expiresAt?: string;
  unfillableReason?: string;
  unfillableAt?: string;
  pair: ApiPair;
}

export interface ApiPair extends ApiModel {
  name: string;
  makerCurrencyUuid: string;
  takerCurrencyUuid: string;
  makerCurrency: ApiCurrency;
  takerCurrency: ApiCurrency;
}

export interface ApiCurrency extends ApiModel {
  symbol: string;
  contractAddress: string;
  decimals: number;
  soloMarket: number;
}

export interface ApiAccount extends ApiModel {
  owner: string;
  number: string;
  balances: {
    [marketNumber: string]: {
      par: string;
      wei: string;
      expiresAt?: string;
      expiryAddress?: string;
    };
  };
}

export interface ApiOrderOnOrderbook {
  id: string;
  uuid: string;
  amount: string;
  price: string;
}

export interface ApiFill extends ApiModel {
  status: ApiFillStatus;
  orderId: string;
  transactionHash: string;
  fillAmount: string;
  order: ApiOrder;
}

export interface ApiTrade extends ApiModel {
  status: ApiFillStatus;
  transactionHash: string;
  makerOrderId: string;
  takerOrderId: string;
  market: string;
  price: string;
  amount: string;
  makerAccountOwner: address;
  makerAccountNumber: number;
  takerAccountOwner: address;
  takerAccountNumber: number;
}

export interface ApiMarket {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  name: string;
  symbol: string;
  supplyIndex: string;
  borrowIndex: string;
  totalSupplyPar: string;
  totalBorrowPar: string;
  lastIndexUpdateSeconds: string;
  oraclePrice: string;
  collateralRatio: string;
  marginPremium: string;
  spreadPremium: string;
  currencyUuid: string;
  currency: ApiCurrency;
  totalSupplyAPR: string;
  totalBorrowAPR: string;
  totalSupplyAPY: string;
  totalBorrowAPY: string;
  totalSupplyWei: string;
  totalBorrowWei: string;
}

interface ApiModel {
  uuid: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export enum OrderType {
  DYDX = 'dydexLimitV1',
  ETH_2_DAI = 'OasisV3',
  ZERO_EX = '0x-V2',
}

export enum ApiOrderUpdateType {
  NEW = 'NEW',
  REMOVED = 'REMOVED',
  UPDATED = 'UPDATED',
}

export enum ApiSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface ApiOrderbookUpdate {
  type: ApiOrderUpdateType;
  id: string;
  side: ApiSide;
  amount?: string;
  price?: string;
}
