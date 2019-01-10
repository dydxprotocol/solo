import BN from 'bn.js';
import { Contracts } from '../../lib/Contracts';
import { ContractCallOptions, TxResult, address } from '../../types';
import { Token } from '../Token';
import { TestToken as TestTokenContract } from '../../../build/wrappers/TestToken';

export class TestToken {
  private contracts: Contracts;
  private token: Token;
  private testTokenContract: TestTokenContract;

  constructor(
    contracts: Contracts,
    token: Token,
    testTokenContract: TestTokenContract,
  ) {
    this.contracts = contracts;
    this.token = token;
    this.testTokenContract = testTokenContract;
  }

  public issue(
    amount: BN,
    from: address,
    options: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issue(
        amount.toString(),
      ),
      { ...options, from },
    );
  }

  public issueTo(
    amount: BN,
    who: address,
    options: ContractCallOptions,
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.testTokenContract.methods.issueTo(
        who,
        amount.toString(),
      ),
      { ...options },
    );
  }

  public async getAllowance(
    ownerAddress: address,
    spenderAddress: address,
  ): Promise<BN> {
    return this.token.getAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      spenderAddress,
    );
  }

  public async getBalance(
    ownerAddress: address,
  ): Promise<BN> {
    return this.token.getBalance(
      this.testTokenContract.options.address,
      ownerAddress,
    );
  }

  public async getTotalSupply(): Promise<BN> {
    return this.token.getTotalSupply(
      this.testTokenContract.options.address,
    );
  }

  public async getName(): Promise<string> {
    return this.token.getName(
      this.testTokenContract.options.address,
    );
  }

  public async getSymbol(): Promise<string> {
    return this.token.getSymbol(
      this.testTokenContract.options.address,
    );
  }

  public async getDecimals(): Promise<BN> {
    return this.token.getDecimals(
      this.testTokenContract.options.address,
    );
  }

  public async getSoloAllowance(
    ownerAddress: address,
  ): Promise<BN> {
    return this.token.getSoloAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
    );
  }

  public async setAllowance(
    ownerAddress: address,
    spenderAddress: address,
    amount: BN,
    options: ContractCallOptions,
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
    amount: BN,
    options: ContractCallOptions,
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
    options: ContractCallOptions,
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
    options: ContractCallOptions,
  ): Promise<TxResult> {
    return this.token.setMaximumSoloAllowance(
      this.testTokenContract.options.address,
      ownerAddress,
      options,
    );
  }

  public async unsetSoloAllowance(
    ownerAddress: address,
    options: ContractCallOptions,
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
    amount: BN,
    options: ContractCallOptions,
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
    amount: BN,
    options: ContractCallOptions,
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
