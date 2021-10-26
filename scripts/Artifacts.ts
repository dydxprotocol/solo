/**
 * To publish a contract with the published npm package, include it here
 */

import { default as SoloMargin } from '../build/contracts/SoloMargin.json';
import { default as IErc20 } from '../build/contracts/IErc20.json';
import { default as IInterestSetter } from '../build/contracts/IInterestSetter.json';
import { default as IPriceOracle } from '../build/contracts/IPriceOracle.json';
import { default as Expiry } from '../build/contracts/Expiry.json';
import { default as ExpiryV2 } from '../build/contracts/ExpiryV2.json';
import { default as FinalSettlement } from '../build/contracts/FinalSettlement.json';
import { default as Refunder } from '../build/contracts/Refunder.json';
import { default as DaiMigrator } from '../build/contracts/DaiMigrator.json';
import { default as LimitOrders } from '../build/contracts/LimitOrders.json';
import { default as StopLimitOrders } from '../build/contracts/StopLimitOrders.json';
import { default as CanonicalOrders } from '../build/contracts/CanonicalOrders.json';
import { default as PayableProxyForSoloMargin }
  from '../build/contracts/PayableProxyForSoloMargin.json';
import { default as SignedOperationProxy }
  from '../build/contracts/SignedOperationProxy.json';
import { default as LiquidatorProxyV1ForSoloMargin }
  from '../build/contracts/LiquidatorProxyV1ForSoloMargin.json';
import { default as PolynomialInterestSetter }
  from '../build/contracts/PolynomialInterestSetter.json';
import { default as DoubleExponentInterestSetter }
  from '../build/contracts/DoubleExponentInterestSetter.json';
import { default as WethPriceOracle } from '../build/contracts/WethPriceOracle.json';
import { default as DaiPriceOracle } from '../build/contracts/DaiPriceOracle.json';
import { default as UsdcPriceOracle } from '../build/contracts/UsdcPriceOracle.json';
import { default as Weth } from '../build/contracts/WETH9.json';
import { default as Events } from '../build/contracts/Events.json';
import { default as AdminImpl } from '../build/contracts/AdminImpl.json';
import { default as OperationImpl } from '../build/contracts/OperationImpl.json';
import { default as Permission } from '../build/contracts/Permission.json';
import { default as PartiallyDelayedMultiSig }
  from '../build/contracts/PartiallyDelayedMultiSig.json';

export default {
  SoloMargin,
  IErc20,
  IInterestSetter,
  IPriceOracle,
  Expiry,
  ExpiryV2,
  FinalSettlement,
  Refunder,
  DaiMigrator,
  LimitOrders,
  StopLimitOrders,
  CanonicalOrders,
  PayableProxyForSoloMargin,
  SignedOperationProxy,
  LiquidatorProxyV1ForSoloMargin,
  PolynomialInterestSetter,
  DoubleExponentInterestSetter,
  WethPriceOracle,
  DaiPriceOracle,
  UsdcPriceOracle,
  Weth,
  Events,
  AdminImpl,
  OperationImpl,
  Permission,
  PartiallyDelayedMultiSig,
};
