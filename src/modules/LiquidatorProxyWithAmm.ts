import { Contracts } from '../lib/Contracts';
import { address, ContractCallOptions, Integer, TxResult } from '../types';

export class LiquidatorProxyWithAmm {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ State-Changing Functions ============

  /**
   * Liquidate liquidAccount using solidAccount. This contract and the msg.sender to this contract
   * must both be operators for the solidAccount.
   *
   * @param  accountOwner                 The address of the account that will do the liquidating
   * @param  accountNumber                The index of the account that will do the liquidating
   * @param  liquidOwner                  The address of the account that will be liquidated
   * @param  liquidNumber                 The index of account that will be liquidated
   * @param  owedMarket                   The owed market whose borrowed value will be added to
   *                                      `toLiquidate`
   * @param  heldMarket                   The held market whose collateral will be recovered to take
   *                                      on the debt of `owedMarket`
   * @param  tokenPath                    The path through which the trade will be routed to recover
   *                                      the collateral
   * @param  expiry                       The time at which the position expires, if this
   *                                      liquidation is for closing an expired position. Else, 0.
   * @param  minOwedOutputAmount          The minimum amount that should be outputted by the trade
   *                                      from heldWei to owedWei. Used to prevent sandwiching and
   *                                      mem-pool other attacks. Only used if
   *                                      `revertOnFailToSellCollateral` is set to `false` and the
   *                                      collateral cannot cover the `liquidAccount`'s debt.
   * @param  revertOnFailToSellCollateral True to revert the transaction completely if all
   *                                      collateral from the liquidation cannot repay the owed
   *                                      debt. False to swallow the error and sell whatever is
   *                                      possible.
   * @param  options                      Additional options to be passed through to the web3 call.
   */
  public async liquidate(
    accountOwner: address,
    accountNumber: Integer,
    liquidOwner: address,
    liquidNumber: Integer,
    owedMarket: Integer,
    heldMarket: Integer,
    tokenPath: address[],
    expiry: Integer | null,
    minOwedOutputAmount: Integer,
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
        minOwedOutputAmount.toFixed(0),
        revertOnFailToSellCollateral,
      ),
      options,
    );
  }
}
