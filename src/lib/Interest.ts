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

import { BigNumber } from 'bignumber.js';
import { Decimal, Integer } from '../types';
import { getInterestPerSecond } from './Helpers';
import interestConstants from './interest-constants.json';

export class Interest {
  private networkId: number;

  constructor(
    networkId: number,
  ) {
    this.setNetworkId(networkId);
  }

  public setNetworkId(
    networkId: number,
  ): void {
    this.networkId = networkId;
  }

  public getEarningsRate(): Decimal {
    const networkConstants = this.getNetworkConstants();
    const earningsRate = new BigNumber(networkConstants.earningsRate);
    if (!earningsRate) {
      throw new Error(`No earnings rate for network: ${this.networkId}`);
    }
    return new BigNumber(earningsRate);
  }

  public getInterestPerSecondByMarket(
    marketId: Integer,
    totals: { totalBorrowed: Integer, totalSupply: Integer },
  ) {
    const earningsRate = this.getEarningsRate();
    const constants = this.getMarketConstants(marketId);

    // determine the borrow interest rate (capped at 18 decimal places)
    const borrowInterestRate = getInterestPerSecond(
      new BigNumber(constants.maxAPR),
      constants.coefficients,
      totals,
    );

    // determine the supply interest rate (uncapped decimal places)
    let supplyInterestRate = borrowInterestRate.times(earningsRate);
    if (totals.totalBorrowed.lt(totals.totalSupply)) {
      supplyInterestRate = supplyInterestRate.times(totals.totalBorrowed).div(totals.totalSupply);
    }

    return {
      borrowInterestRate,
      supplyInterestRate,
    };
  }

  // ============ Private Helper Functions ============

  private getNetworkConstants() {
    const networkConstants = interestConstants[this.networkId];
    if (!networkConstants) {
      throw new Error(`No interest constants for network: ${this.networkId}`);
    }
    return networkConstants;
  }

  private getMarketConstants(
    marketId: Integer,
  ) {
    const networkConstants = this.getNetworkConstants();
    const constants = networkConstants[marketId.toFixed(0)];
    if (!constants) {
      throw new Error(`No interest constants for marketId: ${marketId.toFixed(0)}`);
    }
    return constants;
  }
}
