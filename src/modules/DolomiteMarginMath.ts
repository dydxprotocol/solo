import {
  Index,
  Integer,
} from '../index';
import { INTEGERS } from '../lib/Constants';

export default class DolomiteMarginMath {

  public static getPartialRoundHalfUp(
    target: Integer,
    numerator: Integer,
    denominator: Integer,
  ): Integer {
    const value = target.abs()
      .times(numerator);
    const halfUp = value.mod(denominator)
      .gte(denominator.minus(1)
        .dividedToIntegerBy(2)
        .plus(1))
      ? 1
      : 0;
    const result = value.dividedToIntegerBy(denominator)
      .plus(halfUp);

    if (target.lt(INTEGERS.ZERO)) {
      return result.negated();
    }
    return result;
  }

  public static getPartialRoundUp(
    target: Integer,
    numerator: Integer,
    denominator: Integer,
  ): Integer {
    const result = target
      .abs()
      .times(numerator)
      .minus('1')
      .dividedToIntegerBy(denominator)
      .plus('1');
    if (target.lt(INTEGERS.ZERO)) {
      return result.negated();
    }

    return result;
  }

  public static weiToPar(valueWei: Integer, index: Index): Integer {
    const base = INTEGERS.INTEREST_RATE_BASE;
    if (valueWei.lt(INTEGERS.ZERO)) {
      return DolomiteMarginMath.getPartialRoundHalfUp(
        valueWei.negated(),
        base,
        index.borrow.times(base),
      ).negated();
    }

    return DolomiteMarginMath.getPartialRoundHalfUp(
      valueWei,
      base,
      index.supply.times(base),
    );
  }

  public static parToWei(valueWei: Integer, index: Index): Integer {
    const base = INTEGERS.INTEREST_RATE_BASE;
    if (valueWei.lt(INTEGERS.ZERO)) {
      return DolomiteMarginMath.getPartialRoundHalfUp(
        valueWei.negated(),
        index.borrow.times(base),
        base,
      ).negated();
    }

    return DolomiteMarginMath.getPartialRoundHalfUp(
      valueWei,
      index.supply.times(base),
      base,
    );
  }

}
