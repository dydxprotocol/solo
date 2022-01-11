import { TestContracts } from './TestContracts';
import { Token } from '../../src/modules/Token';
import { TestToken as TestTokenContract } from '../../build/testing_wrappers/TestToken';
import {
  address,
  ContractCallOptions,
  ContractConstantCallOptions,
  Integer,
  TxResult,
} from '../../src';

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

  public get address(): string {
    return this.testTokenContract.options.address;
  }

  public issue(
    amount: Integer,
    from: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issue(amount.toFixed(0)),
      { ...options, from },
    );
  }

  public issueTo(
    amount: Integer,
    who: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issueTo(who, amount.toFixed(0)),
      { ...options },
    );
  }

  public approve(
    spender: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.approve(spender, amount.toFixed(0)),
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

  public async getName(options?: ContractConstantCallOptions): Promise<string> {
    return this.token.getName(this.testTokenContract.options.address, options);
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

  public async getDolomiteMarginAllowance(
    ownerAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getDolomiteMarginAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async setBalance(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.setBalance(
        ownerAddress,
        amount.toFixed(0),
      ),
      { ...options, from: options.from ? options.from : ownerAddress },
    );
  }

  public async setDolomiteMarginAllowance(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setDolomiteMarginllowance(
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

  public async setMaximumDolomiteMarginAllowance(
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setMaximumDolomiteMarginAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async unsetDolomiteMarginAllowance(
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.unsetDolomiteMarginAllowance(
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
