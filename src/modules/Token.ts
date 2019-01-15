import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import { INTEGERS } from '../lib/Constants';
import { IErc20 as ERC20 } from '../../build/wrappers/IErc20';
import { ContractCallOptions, TxResult, address, Integer } from '../types';

export class Token {
  private contracts: Contracts;
  private tokens: object;

  constructor(
    contracts: Contracts,
  ) {
    this.contracts = contracts;
    this.tokens = {};
  }

  public async getAllowance(
    tokenAddress: address,
    ownerAddress: address,
    spenderAddress: address,
  ): Promise<Integer> {
    const token = this.getToken(tokenAddress);
    const allowStr: string = await token.methods.allowance(ownerAddress, spenderAddress).call();
    return new BigNumber(allowStr);
  }

  public async getBalance(
    tokenAddress: address,
    ownerAddress: address,
  ): Promise<Integer> {
    const token = this.getToken(tokenAddress);
    const balStr: string = await token.methods.balanceOf(ownerAddress).call();
    return new BigNumber(balStr);
  }

  public async getTotalSupply(tokenAddress: address): Promise<Integer> {
    const token = this.getToken(tokenAddress);
    const supplyStr: string = await token.methods.totalSupply().call();
    return new BigNumber(supplyStr);
  }

  public async getName(tokenAddress: address): Promise<string> {
    const token = this.getToken(tokenAddress);
    return token.methods.name().call();
  }

  public async getSymbol(tokenAddress: address): Promise<string> {
    const token = this.getToken(tokenAddress);
    return token.methods.symbol().call();
  }

  public async getDecimals(tokenAddress: address): Promise<Integer> {
    const token = this.getToken(tokenAddress);
    const decStr: string = await token.methods.decimals().call();
    return new BigNumber(decStr);
  }

  public async getSoloAllowance(
    tokenAddress: address,
    ownerAddress: address,
  ): Promise<Integer> {
    return this.getAllowance(
      tokenAddress,
      ownerAddress,
      this.contracts.soloMargin.options.address,
    );
  }

  public async setAllowance(
    tokenAddress: address,
    ownerAddress: address,
    spenderAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const token = this.getToken(tokenAddress);

    return this.contracts.callContractFunction(
      token.methods.approve(
        spenderAddress,
        amount.toFixed(0),
      ),
      { ...options, from: ownerAddress },
    );
  }

  public async setSolollowance(
    tokenAddress: address,
    ownerAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.setAllowance(
      tokenAddress,
      ownerAddress,
      this.contracts.soloMargin.options.address,
      amount,
      options,
    );
  }

  public async setMaximumAllowance(
    tokenAddress: address,
    ownerAddress: address,
    spenderAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.setAllowance(
      tokenAddress,
      ownerAddress,
      spenderAddress,
      INTEGERS.ONES_255,
      options,
    );
  }

  public async setMaximumSoloAllowance(
    tokenAddress: address,
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.setAllowance(
      tokenAddress,
      ownerAddress,
      this.contracts.soloMargin.options.address,
      INTEGERS.ONES_255,
      options,
    );
  }

  public async unsetSoloAllowance(
    tokenAddress: address,
    ownerAddress: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.setAllowance(
      tokenAddress,
      ownerAddress,
      this.contracts.soloMargin.options.address,
      INTEGERS.ZERO,
      options,
    );
  }

  public async transfer(
    tokenAddress: address,
    fromAddress: address,
    toAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const token = this.getToken(tokenAddress);

    return this.contracts.callContractFunction(
      token.methods.transfer(
        toAddress,
        amount.toFixed(0),
      ),
      { ...options, from: fromAddress },
    );
  }

  public async transferFrom(
    tokenAddress: address,
    fromAddress: address,
    toAddress: address,
    senderAddress: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    const token = this.getToken(tokenAddress);

    return this.contracts.callContractFunction(
      token.methods.transferFrom(
        fromAddress,
        toAddress,
        amount.toFixed(0),
      ),
      { ...options, from: senderAddress },
    );
  }

  private getToken(
    tokenAddress: string,
  ): ERC20 {
    if (this.tokens[tokenAddress]) {
      return this.tokens[tokenAddress];
    }

    const token: ERC20 = this.contracts.erc20;
    const contract: ERC20 = token.clone();
    contract.options.address = tokenAddress;

    this.tokens[tokenAddress] = contract;

    return contract;
  }
}
