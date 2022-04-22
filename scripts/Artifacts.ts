/**
 * To publish a contract with the published npm package, include it here
 */

import { default as DolomiteMargin } from '../build/contracts/DolomiteMargin.json';
import { default as IERC20 } from '../build/contracts/IERC20.json';
import { default as IInterestSetter } from '../build/contracts/IInterestSetter.json';
import { default as IPriceOracle } from '../build/contracts/IPriceOracle.json';
import { default as Expiry } from '../build/contracts/Expiry.json';
import { default as PayableProxy }
  from '../build/contracts/PayableProxy.json';
import { default as SignedOperationProxy }
  from '../build/contracts/SignedOperationProxy.json';
import { default as LiquidatorProxyV1 }
  from '../build/contracts/LiquidatorProxyV1.json';
import { default as LiquidatorProxyV1WithAmm }
  from '../build/contracts/LiquidatorProxyV1WithAmm.json';
import { default as DolomiteAmmRouterProxy }
  from '../build/contracts/DolomiteAmmRouterProxy.json';
import { default as PolynomialInterestSetter }
  from '../build/contracts/PolynomialInterestSetter.json';
import { default as DoubleExponentInterestSetter }
  from '../build/contracts/DoubleExponentInterestSetter.json';
import { default as Weth } from '../build/contracts/WETH9.json';
import { default as Events } from '../build/contracts/Events.json';
import { default as AdminImpl } from '../build/contracts/AdminImpl.json';
import { default as OperationImpl } from '../build/contracts/OperationImpl.json';
import { default as DepositImpl } from '../build/contracts/DepositImpl.json';
import { default as WithdrawalImpl } from '../build/contracts/WithdrawalImpl.json';
import { default as TransferImpl } from '../build/contracts/TransferImpl.json';
import { default as TradeImpl } from '../build/contracts/TradeImpl.json';
import { default as LiquidateOrVaporizeImpl } from '../build/contracts/LiquidateOrVaporizeImpl.json';
import { default as CallImpl } from '../build/contracts/CallImpl.json';
import { default as Permission } from '../build/contracts/Permission.json';
import { default as PartiallyDelayedMultiSig }
  from '../build/contracts/PartiallyDelayedMultiSig.json';
import { default as ChainlinkPriceOracleV1 } from '../build/contracts/ChainlinkPriceOracleV1.json';
import { default as SimpleFeeOwner } from '../build/contracts/SimpleFeeOwner.json';
import { default as DolomiteAmmFactory } from '../build/contracts/DolomiteAmmFactory.json';
import { default as DolomiteAmmPair } from '../build/contracts/DolomiteAmmPair.json';
import { default as TransferProxy } from '../build/contracts/TransferProxy.json';
import { default as DepositWithdrawalProxy } from '../build/contracts/DepositWithdrawalProxy.json';
import { default as AmmRebalancerProxyV1 } from '../build/contracts/AmmRebalancerProxyV1.json';
import { default as AmmRebalancerProxyV2 } from '../build/contracts/AmmRebalancerProxyV2.json';
import { default as ArbitrumMultiCall } from '../build/contracts/ArbitrumMultiCall.json';
import { default as MultiCall } from '../build/contracts/MultiCall.json';
import { default as IArbitrumGasInfo } from '../build/contracts/IArbitrumGasInfo.json';
import { default as TestUniswapAmmRebalancerProxy } from '../build/contracts/TestUniswapAmmRebalancerProxy.json';

export default {
  DepositImpl,
  WithdrawalImpl,
  TransferImpl,
  TradeImpl,
  LiquidateOrVaporizeImpl,
  CallImpl,
  OperationImpl,
  AdminImpl,
  DolomiteMargin,
  IERC20,
  IInterestSetter,
  IPriceOracle,
  Expiry,
  PayableProxy,
  SignedOperationProxy,
  LiquidatorProxyV1,
  LiquidatorProxyV1WithAmm,
  AmmRebalancerProxyV1,
  AmmRebalancerProxyV2,
  DolomiteAmmRouterProxy,
  PolynomialInterestSetter,
  DoubleExponentInterestSetter,
  Weth,
  Events,
  Permission,
  PartiallyDelayedMultiSig,
  ChainlinkPriceOracleV1,
  DolomiteAmmFactory,
  DolomiteAmmPair,
  SimpleFeeOwner,
  TransferProxy,
  DepositWithdrawalProxy,
  ArbitrumMultiCall,
  MultiCall,
  IArbitrumGasInfo,
  TestUniswapAmmRebalancerProxy,
};
