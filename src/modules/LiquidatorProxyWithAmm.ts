import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer, TxResult, } from '../types';

export class LiquidatorProxyWithAmm {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  public async liquidate(
    accountOwner: address,
    accountNumber: Integer,
    liquidOwner: address,
    liquidNumber: Integer,
    owedMarket: Integer,
    heldMarket: Integer,
    tokenPath: address[],
    expiry: Integer | null,
    revertOnFailToSellCollateral: boolean,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.liquidatorProxyV1WithAmm.methods.liquidate(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        {
          owner: liquidOwner,
          number: liquidNumber.toFixed(0),
        },
        owedMarket.toFixed(0),
        heldMarket.toFixed(0),
        tokenPath,
        expiry ? expiry.toFixed(0) : '0',
        revertOnFailToSellCollateral,
      ),
      options,
    );
  }
}
