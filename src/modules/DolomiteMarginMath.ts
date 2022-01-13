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
    if (valueWei.lt(INTEGERS.ZERO)) {
      return DolomiteMarginMath.getPartialRoundUp(
        valueWei,
        INTEGERS.INTEREST_RATE_BASE,
        index.borrow.times(INTEGERS.INTEREST_RATE_BASE),
      );
    }

    return valueWei.dividedToIntegerBy(index.supply);
  }

  public static parToWei(valueWei: Integer, index: Index): Integer {
    const base = INTEGERS.INTEREST_RATE_BASE;
    if (valueWei.lt(INTEGERS.ZERO)) {
      return DolomiteMarginMath.getPartialRoundUp(
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
