import { DolomiteAmmPair as DolomiteAmmPairWrapper } from '../../build/wrappers/DolomiteAmmPair';
import { Contracts } from '../lib/Contracts';
import {
  address,
  ContractCallOptions,
  Integer,
  TxResult,
} from '../types';
import BigNumber from 'bignumber.js';

export interface Reserves {
  reserve0: Integer;
  reserve1: Integer;
  blockTimestampLast: number;
}

export class DolomiteAmmPair {
  private contracts: Contracts;
  private pair: DolomiteAmmPairWrapper;

  constructor(contracts: Contracts, pair: DolomiteAmmPairWrapper) {
    this.contracts = contracts;
    this.pair = pair;
  }

  // ============ View Functions ============

  public async dolomiteMargin(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.dolomiteMargin()
    );
  }

  public async dolomiteAmmFactory(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.factory()
    );
  }

  public async balanceOf(owner: address): Promise<Integer> {
    const balance = await this.contracts.callConstantContractFunction(
      this.pair.methods.balanceOf(owner)
    );
    return new BigNumber(balance);
  }

  public async name(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.name()
    );
  }

  public async symbol(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.symbol()
    );
  }

  public async allowance(owner: address, spender: address): Promise<Integer> {
    const allowance = await this.contracts.callConstantContractFunction(
      this.pair.methods.allowance(owner, spender)
    );
    return new BigNumber(allowance);
  }

  public async decimals(): Promise<number> {
    const decimals = await this.contracts.callConstantContractFunction(
      this.pair.methods.decimals()
    );
    return parseInt(decimals, 10);
  }

  public async dolomiteMarginTransferProxy(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.dolomiteMarginTransferProxy()
    );
  }

  public async domainSeparator(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.DOMAIN_SEPARATOR()
    );
  }

  public async getReservesPar(): Promise<Reserves> {
    const { _reserve0, _reserve1, _blockTimestampLast } = await this.contracts.callConstantContractFunction(
      this.pair.methods.getReservesPar()
    );
    return {
      reserve0: new BigNumber(_reserve0),
      reserve1: new BigNumber(_reserve1),
      blockTimestampLast: parseInt(_blockTimestampLast, 10),
    };
  }

  public async getReservesWei(): Promise<Reserves> {
    const { _reserve0, _reserve1, _blockTimestampLast } = await this.contracts.callConstantContractFunction(
      this.pair.methods.getReservesWei()
    );
    return {
      reserve0: new BigNumber(_reserve0),
      reserve1: new BigNumber(_reserve1),
      blockTimestampLast: parseInt(_blockTimestampLast, 10),
    };
  }

  public async kLast(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.kLast()
    );
    return new BigNumber(result);
  }

  public async price0CumulativeLast(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.price0CumulativeLast()
    );
    return new BigNumber(result);
  }

  public async price1CumulativeLast(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.price1CumulativeLast()
    );
    return new BigNumber(result);
  }

  public async marketId0(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.marketId0()
    );
    return new BigNumber(result);
  }

  public async marketId1(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.marketId1()
    );
    return new BigNumber(result);
  }

  public async nonceOf(owner: address): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.nonces(owner)
    );
    return new BigNumber(result);
  }

  public async permitTypeHash(): Promise<string> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.PERMIT_TYPEHASH()
    );
  }

  public async token0(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.token0()
    );
  }

  public async token1(): Promise<address> {
    return this.contracts.callConstantContractFunction(
      this.pair.methods.token1()
    );
  }

  public async totalSupply(): Promise<Integer> {
    const result = await this.contracts.callConstantContractFunction(
      this.pair.methods.totalSupply()
    );
    return new BigNumber(result);
  }

  // ============ Write Functions ============

  public async approve(
    spender: address,
    value: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.approve(spender, value.toFixed()),
      options,
    );
  }

  public async transfer(
    recipient: address,
    amount: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.transfer(recipient, amount.toFixed()),
      options,
    );
  }

  public async mint(
    to: address,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.mint(to),
      options,
    );
  }

  public async burn(
    to: address,
    toAccountNumber: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.burn(to, toAccountNumber.toFixed()),
      options,
    );
  }

  public async permit(
    owner: address,
    spender: address,
    value: Integer,
    deadline: number,
    v: number,
    r: string,
    s: string,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.permit(
        owner,
        spender,
        value.toFixed(),
        deadline,
        v,
        r,
        s,
      ),
      options,
    );
  }

  public async skim(
    to: address,
    toAccountNumber: Integer,
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.skim(to, toAccountNumber.toFixed()),
      options,
    );
  }

  public async sync(
    options: ContractCallOptions = {},
  ): Promise<TxResult> {
    return this.contracts.callContractFunction(
      this.pair.methods.sync(),
      options,
    );
  }

}
