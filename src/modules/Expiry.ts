import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  ContractConstantCallOptions,
  Integer,
  TxResult,
} from '../../src/types';

export class Expiry {
  private contracts: Contracts;

  // ============ Constructor ============

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // ============ Getters ============

  public get address(): string {
    return this.contracts.expiry.options.address;
  }

  public async getAdmin(
    options?: ContractConstantCallOptions,
  ): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.owner(),
      options,
    );
  }

  public async getExpiry(
    accountOwner: address,
    accountNumber: Integer,
    marketId: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.getExpiry(
        {
          owner: accountOwner,
          number: accountNumber.toFixed(0),
        },
        marketId.toFixed(0),
      ),
      options,
    );
    return new BigNumber(result);
  }

  public async getApproval(
    approver: address,
    sender: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.g_approvedSender(approver, sender),
      options,
    );
    return new BigNumber(result);
  }

  public async getPrices(
    heldMarketId: Integer,
    owedMarketId: Integer,
    expiryTimestamp: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<{ heldPrice: Integer; owedPrice: Integer }> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.getSpreadAdjustedPrices(
        heldMarketId.toFixed(0),
        owedMarketId.toFixed(0),
        expiryTimestamp.toFixed(0),
      ),
      options,
    );

    return {
      heldPrice: new BigNumber(result[0].value),
      owedPrice: new BigNumber(result[1].value),
    };
  }

  public async getRampTime(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.contracts.expiry.methods.g_expiryRampTime(),
      options,
    );
    return new BigNumber(result);
  }

  // ============ Setters ============

  public async setApproval(
    sender: address,
    minTimeDelta: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.expiry.methods.approveSender(
        sender,
        minTimeDelta.toFixed(0),
      ),
      options,
    );
  }

  // ============ Admin ============

  public async setRampTime(
    newExpiryRampTime: Integer,
    options?: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.contracts.expiry.methods.ownerSetExpiryRampTime(
        newExpiryRampTime.toFixed(0),
      ),
      options,
    );
  }
}
