import { Contracts } from '../lib/Contracts';
import { Token } from './Token';
import { Weth as WethContract } from '../../build/wrappers/Weth';
import {
  address,
  ContractCallOptions,
  ContractConstantCallOptions,
  Integer,
  TxResult,
} from '../types';

export class Weth {
  private contracts: Contracts;
  private token: Token;
  private weth: WethContract;

  constructor(contracts: Contracts, token: Token) {
    this.contracts = contracts;
    this.token = token;
    this.weth = contracts.weth;
  }

  public get address(): string {
    return this.weth.options.address;
  }

  public async wrap(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(this.weth.methods.deposit(), {
      ...options,
      from: ownerAddress,
      value: amount.toFixed(0),
    });
  }

  public async unwrap(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.weth.methods.withdraw(amount.toFixed(0)),
      {
        ...options,
        from: ownerAddress,
      },
    );
  }

  public async getAllowance(
    ownerAddress: address,
    spenderAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getAllowance(
      this.weth.options.address,
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
      this.weth.options.address,
      ownerAddress,
      options,
    );
  }

  public async getTotalSupply(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getTotalSupply(this.weth.options.address, options);
  }

  public async getName(options?: ContractConstantCallOptions): Promise<string> {
    return this.token.getName(this.weth.options.address, options);
  }

  public async getSymbol(
    options?: ContractConstantCallOptions,
  ): Promise<string> {
    return this.token.getSymbol(this.weth.options.address, options);
  }

  public async getDecimals(
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getDecimals(this.weth.options.address, options);
  }

  public async getDolomiteMarginAllowance(
    ownerAddress: address,
    options?: ContractConstantCallOptions,
  ): Promise<Integer> {
    return this.token.getDolomiteMarginAllowance(
      this.weth.options.address,
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
      this.weth.options.address,
      ownerAddress,
      spenderAddress,
      amount,
      options,
    );
  }

  public async setDolomiteMarginAllowance(
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.setDolomiteMarginllowance(
      this.weth.options.address,
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
      this.weth.options.address,
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
      this.weth.options.address,
      ownerAddress,
      options,
    );
  }

  public async unsetDolomiteMarginAllowance(
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.token.unsetDolomiteMarginAllowance(
      this.weth.options.address,
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
      this.weth.options.address,
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
      this.weth.options.address,
      fromAddress,
      toAddress,
      senderAddress,
      amount,
      options,
    );
  }
}
