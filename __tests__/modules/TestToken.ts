import { TestContracts } from './TestContracts';
import { Token } from '../../src/modules/Token';
import { TestToken as TestTokenContract } from '../../build/wrappers/TestToken';
import {
  ContractCallOptions,
  ContractConstantCallOptions,
  TxResult,
  address,
  Integer,
} from '../../src/types';

export class TestToken {
  private contracts: TestContracts;
  private token: Token;
  private testTokenContract: TestTokenContract;

  constructor(
    contracts: TestContracts,
    token: Token,
    testTokenContract: TestTokenContract,
  ) {
    this.contracts = contracts;
    this.token = token;
    this.testTokenContract = testTokenContract;
  }

  public getAddress(): string {
    return this.testTokenContract.options.address;
  }

  public issue(
    amount: Integer,
    from: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issue(
        amount.toFixed(0),
      ),
      { ...options, from },
    );
  }

  public issueTo(
    amount: Integer,
    who: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issueTo(
        who,
        amount.toFixed(0),
      ),
      { ...options },
    );
  }

  public async getAllowance(
    ownerAddress: address,
    spenderAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      spenderAddress,
      options,
    );
  }

  public async getBalance(
    ownerAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getBalance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async getTotalSupply(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getTotalSupply(
      this.testTokenContract.options.address,
      options,
    );
  }

  public async getName(
    options?: ContractConstantCallOptions,
  ): Promise<string> {
    return this.token.getName(
      this.testTokenContract.options.address,
      options,
    );
  }

  public async getSymbol(
    options?: ContractConstantCallOptions,
  ): Promise<string> {
    return this.token.getSymbol(
      this.testTokenContract.options.address,
      options,
    );
  }

  public async getDecimals(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getDecimals(
      this.testTokenContract.options.address,
      options,
    );
  }

  public async getSoloAllowance(
    ownerAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getSoloAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async setAllowance(
    ownerAddress: address,
    spenderAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      spenderAddress,
      amount,
      options,
    );
  }

  public async setSolollowance(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setSolollowance(
      this.testTokenContract.options.address,
      ownerAddress,
      amount,
      options,
    );
  }

  public async setMaximumAllowance(
    ownerAddress: address,
    spenderAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setMaximumAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      spenderAddress,
      options,
    );
  }

  public async setMaximumSoloAllowance(
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setMaximumSoloAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async unsetSoloAllowance(
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.unsetSoloAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async transfer(
    fromAddress: address,
    toAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.transfer(
      this.testTokenContract.options.address,
      fromAddress,
      toAddress,
      amount,
      options,
    );
  }

  public async transferFrom(
    fromAddress: address,
    toAddress: address,
    senderAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.transferFrom(
      this.testTokenContract.options.address,
      fromAddress,
      toAddress,
      senderAddress,
      amount,
      options,
    );
  }
}
