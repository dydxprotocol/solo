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

import { BigNumber } from 'bignumber.js';
import { Integer } from '../types';
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

  public getInterestPerSecondByMarket(
    marketId: Integer,
    totals: { totalBorrowed: Integer, totalSupply: Integer },
  ) {
    const networkConstants = interestConstants[this.networkId];
    if (!networkConstants) {
      throw new Error(`No interest constants for network: ${this.networkId}`);
    }

    const constants = networkConstants[marketId.toFixed(0)];
    if (!constants) {
      throw new Error(`No interest constants for marketId: ${marketId.toFixed(0)}`);
    }

    return getInterestPerSecond(
      new BigNumber(constants.maxAPR),
      constants.coefficients,
      totals,
    );
  }
}
