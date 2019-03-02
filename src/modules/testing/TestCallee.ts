import { Contracts } from '../../lib/Contracts';
import { address, Integer, ContractConstantCallOptions } from '../../types';

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
      this.contracts.testCallee.methods.senderData(
        sender,
      ),
      options,
    );
  }
}
