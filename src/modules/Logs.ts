import { EventLog, Log } from 'web3/types';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  address,
  BalanceUpdate,
  Decimal,
  Index,
  Integer,
  LogParsingOptions,
  TxResult,
} from '../types';
import { stringToDecimal, valueToInteger } from '../lib/Helpers';
import { abi as operationAbi } from '../../build/published_contracts/Events.json';
import { abi as adminAbi } from '../../build/published_contracts/AdminImpl.json';
import { abi as permissionAbi } from '../../build/published_contracts/Permission.json';
import { abi as expiryAbi } from '../../build/published_contracts/Expiry.json';
import { abi as signedOperationProxyAbi } from '../../build/published_contracts/SignedOperationProxy.json';

export class Logs {
  private contracts: Contracts;
  private web3: Web3;

  constructor(contracts: Contracts, web3: Web3) {
    this.contracts = contracts;
    this.web3 = web3;
  }

  public parseLogs(receipt: TxResult, options: LogParsingOptions = {}): any {
    let logs = this.parseAllLogs(receipt);

    if (options.skipAdminLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, adminAbi));
    }
    if (options.skipOperationLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, operationAbi));
    }
    if (options.skipPermissionLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, permissionAbi));
    }
    if (options.skipSignedOperationProxyLogs) {
      logs = logs.filter(
        (log: any) => !this.logIsFrom(log, signedOperationProxyAbi),
      );
    }
    if (options.skipExpiryLogs) {
      logs = logs.filter(
        (log: any) => !this.logIsFrom(log, expiryAbi),
      );
    }

    return logs;
  }

  private logIsFrom(log: any, abi: any) {
    return abi.filter((e: any) => e.name === log.name).length !== 0;
  }

  private parseAllLogs(receipt: TxResult): any {
    let events: any[];

    if (receipt.logs) {
      events = JSON.parse(JSON.stringify(receipt.logs));
      return events.map(e => this.parseLog(e)).filter(l => !!l);
    }

    if (receipt.events) {
      const tempEvents = JSON.parse(JSON.stringify(receipt.events));
      events = [];
      Object.values(tempEvents).forEach((e: any) => {
        if (Array.isArray(e)) {
          e.forEach(ev => events.push(ev));
        } else {
          events.push(e);
        }
      });
      events.sort((a, b) => a.logIndex - b.logIndex);
      return events.map(e => this.parseEvent(e)).filter(l => !!l);
    }

    throw new Error('Receipt has no logs');
  }

  private parseEvent(event: EventLog) {
    return this.parseLog({
      address: event.address,
      data: event.raw.data,
      topics: event.raw.topics,
      logIndex: event.logIndex,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      blockHash: event.blockHash,
      blockNumber: event.blockNumber,
    });
  }

  private parseLog(log: Log) {
    switch (log.address.toLowerCase()) {
      case this.contracts.dolomiteMargin.options.address.toLowerCase(): {
        return this.parseLogWithContract(this.contracts.dolomiteMargin, log);
      }
      case this.contracts.expiry.options.address.toLowerCase(): {
        return this.parseLogWithContract(this.contracts.expiry, log);
      }
      // case this.contracts.refunder.options.address.toLowerCase(): {
      //   return this.parseLogWithContract(this.contracts.refunder, log);
      // }
      // case this.contracts.limitOrders.options.address.toLowerCase(): {
      //   return this.parseLogWithContract(this.contracts.limitOrders, log);
      // }
      // case this.contracts.stopLimitOrders.options.address.toLowerCase(): {
      //   return this.parseLogWithContract(this.contracts.stopLimitOrders, log);
      // }
      // case this.contracts.canonicalOrders.options.address.toLowerCase(): {
      //   return this.parseLogWithContract(this.contracts.canonicalOrders, log);
      // }
      case this.contracts.signedOperationProxy.options.address.toLowerCase(): {
        return this.parseLogWithContract(
          this.contracts.signedOperationProxy,
          log,
        );
      }
    }

    return null;
  }

  parseLogWithContract(contract: any, log: Log) {
    const events = contract.options.jsonInterface.filter(
      (e: any) => e.type === 'event',
    );

    const eventJson = events.find(
      (e: any) => e.signature.toLowerCase() === log.topics[0].toLowerCase(),
    );

    if (!eventJson) {
      throw new Error('Event type not found');
    }

    const eventArgs = this.web3.eth.abi.decodeLog(
      eventJson.inputs,
      log.data,
      log.topics.slice(1),
    );

    return {
      ...log,
      name: eventJson.name,
      args: this.parseArgs(eventJson, eventArgs),
    };
  }

  parseArgs(eventJson: any, eventArgs: any) {
    const parsed: any = {};

    eventJson.inputs.forEach((input: any) => {
      let val: any;

      if (input.type === 'address') {
        val = eventArgs[input.name];
      } else if (input.type === 'bool') {
        val = eventArgs[input.name];
      } else if (input.type.match(/^bytes[0-9]*$/)) {
        val = eventArgs[input.name];
      } else if (input.type.match(/^uint[0-9]*$/)) {
        val = new BigNumber(eventArgs[input.name]);
      } else if (input.type === 'tuple') {
        val = Logs.parseTuple(input, eventArgs);
      } else if (input.type === 'string') {
        val = eventArgs[input.name];
      } else {
        throw new Error(`Unknown event arg type ${input.type}`);
      }
      parsed[input.name] = val;

      if (input.name === 'orderFlags') {
        const parsedOrderFlags = Logs.parseOrderFlags(eventArgs[input.name]);
        parsed.isBuy = parsedOrderFlags.isBuy;
        parsed.isDecreaseOnly = parsedOrderFlags.isDecreaseOnly;
        parsed.isNegativeLimitFee = parsedOrderFlags.isNegativeLimitFee;
      }
    });

    return parsed;
  }

  private static parseOrderFlags(
    flags: string,
  ): {
    isBuy: boolean;
    isDecreaseOnly: boolean;
    isNegativeLimitFee: boolean;
  } {
    const flag = new BigNumber(flags.charAt(flags.length - 1)).toNumber();
    return {
      isBuy: (flag & 1) !== 0,
      isDecreaseOnly: (flag & 2) !== 0,
      isNegativeLimitFee: (flag & 4) !== 0,
    };
  }

  private static parseTuple(input: any, eventArgs: any) {
    if (
      Array.isArray(input.components) &&
      input.components.length === 2 &&
      input.components[0].name === 'owner' &&
      input.components[1].name === 'number'
    ) {
      return Logs.parseAccountInfo(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components) &&
      input.components.length === 2 &&
      input.components[0].name === 'deltaWei' &&
      input.components[1].name === 'newPar'
    ) {
      return Logs.parseBalanceUpdate(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components) &&
      input.components.length === 3 &&
      input.components[0].name === 'borrow' &&
      input.components[1].name === 'supply' &&
      input.components[2].name === 'lastUpdate'
    ) {
      return Logs.parseIndex(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components) &&
      input.components.length === 1 &&
      input.components[0].name === 'value'
    ) {
      if (
        input.name.toLowerCase().includes('spread') ||
        input.name.toLowerCase().includes('ratio') ||
        input.name.toLowerCase().includes('rate') ||
        input.name.toLowerCase().includes('premium')
      ) {
        return Logs.parseDecimalValue(eventArgs[input.name]);
      }
      return Logs.parseIntegerValue(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components) &&
      input.components.length === 3 &&
      input.components[0].name === 'price' &&
      input.components[1].name === 'fee' &&
      input.components[2].name === 'isNegativeFee'
    ) {
      return Logs.parseFillData(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components) &&
      input.components.length === 2 &&
      input.components[0].name === 'sign' &&
      input.components[1].name === 'value'
    ) {
      return Logs.parseWei(eventArgs[input.name]);
    }

    throw new Error('Unknown tuple type in event');
  }

  private static parseAccountInfo(
    accountInfo: any,
  ): {
    owner: address;
    number: BigNumber;
  } {
    return {
      owner: accountInfo.owner,
      number: new BigNumber(accountInfo.number),
    };
  }

  private static parseIndex(index: any): Index {
    return {
      borrow: stringToDecimal(index.borrow),
      supply: stringToDecimal(index.supply),
      lastUpdate: new BigNumber(index.lastUpdate),
    };
  }

  private static parseBalanceUpdate(update: any): BalanceUpdate {
    return {
      deltaWei: valueToInteger(update.deltaWei),
      newPar: valueToInteger(update.newPar),
    };
  }

  private static parseDecimalValue(value: any): Decimal {
    return stringToDecimal(value.value);
  }

  private static parseIntegerValue(value: any): Integer {
    return new BigNumber(value.value);
  }

  private static parseWei(
    weiData: any,
  ): BigNumber {
    return valueToInteger({
      value: weiData.value,
      sign: weiData.sign,
    });
  }

  private static parseFillData(
    fillData: any,
  ): {
    price: BigNumber;
    fee: BigNumber;
    isNegativeFee: boolean;
  } {
    return {
      price: stringToDecimal(fillData.price),
      fee: stringToDecimal(fillData.fee),
      isNegativeFee: fillData.isNegativeFee,
    };
  }
}
