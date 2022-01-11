import { TestContracts } from './TestContracts';
import { address, ContractConstantCallOptions, Integer } from '../../src';

export class TestCallee {
  private contracts: TestContracts;

  constructor(contracts: TestContracts) {
    this.contracts = contracts;
  }

  public get address(): string {
    return this.contracts.testCallee.options.address;
  }

  public async getAccountData(
    accountOwner: address,
    accountNumber: Integer,
    options?: ContractConstantCallOptions,
  ): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testCallee.methods.accountData(
        accountOwner,
        accountNumber.toFixed(0),
      ),
      options,
    );
  }

  public async getSenderData(
    sender: address,
    options?: ContractConstantCallOptions,
  ): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.contracts.testCallee.methods.senderData(sender),
      options,
    );
  }
}
