import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, address, Integer } from '../../types';

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
    options?: ContractCallOptions,
  ): Promise<string> {
    return this.contracts.testCallee.methods.getAccountData(
      {
        owner: accountOwner,
        number: accountNumber.toFixed(0),
      },
    ).call();
  }

  public async getSenderData(
    sender: address,
    options?: ContractCallOptions,
  ): Promise<string> {
    return this.contracts.testCallee.methods.getSenderData(sender).call();
  }
}
