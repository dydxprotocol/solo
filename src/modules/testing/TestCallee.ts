import { Contracts } from '../../lib/Contracts';
import { address, Integer } from '../../types';

export class TestCallee {
  private contracts: Contracts;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
  }

  public getAddress(): string {
    return this.contracts.testCallee.options.address;
  }

  public async getAccountData(
    accountOwner: address,
    accountNumber: Integer,
  ): Promise<string> {
    return this.contracts.testCallee.methods.accountData(
      accountOwner,
      accountNumber.toFixed(0),
    ).call();
  }

  public async getSenderData(
    sender: address,
  ): Promise<string> {
    return this.contracts.testCallee.methods.senderData(
      sender,
    ).call();
  }
}
