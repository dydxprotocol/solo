import { TestContracts } from './TestContracts';
import { address, Integer, CallOptions } from '../../src/types';

export class TestCallee {
  private contracts: TestContracts;

  constructor(
    contracts: TestContracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testCallee.options.address;
  }

  public async getAccountData(
    accountOwner: address,
    accountNumber: Integer,
    options?: CallOptions,
  ): Promise<string> {
    return this.contracts.call(
      this.contracts.testCallee.methods.accountData(
        accountOwner,
        accountNumber.toFixed(0),
      ),
      options,
    );
  }

  public async getSenderData(
    sender: address,
    options?: CallOptions,
  ): Promise<string> {
    return this.contracts.call(
      this.contracts.testCallee.methods.senderData(
        sender,
      ),
      options,
    );
  }
}
