import { Log, EventLog } from 'web3/types';
import { result } from 'lodash';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  address,
  Decimal,
  Integer,
  BalanceUpdate,
  Index,
  LogParsingOptions,
  TxResult,
} from '../types';
import { stringToDecimal, valueToInteger } from '../lib/Helpers';
import { abi as operationAbi } from '../../build/published_contracts/Events.json';
import { abi as adminAbi } from '../../build/published_contracts/AdminImpl.json';
import { abi as permissionAbi } from '../../build/published_contracts/Permission.json';
import { abi as expiryAbi } from '../../build/published_contracts/Expiry.json';
import { abi as expiryV2Abi } from '../../build/published_contracts/ExpiryV2.json';
import { abi as refunderAbi } from '../../build/published_contracts/Refunder.json';
import { abi as limitOrdersAbi } from '../../build/published_contracts/LimitOrders.json';
import {
  abi as signedOperationProxyAbi,
} from '../../build/published_contracts/SignedOperationProxy.json';

export class Logs {
  private contracts: Contracts;
  private web3: Web3;

  constructor(
    contracts: Contracts,
    web3: Web3,
  ) {
    this.contracts = contracts;
    this.web3 = web3;
  }

  public parseLogs(
    receipt: TxResult,
    options: LogParsingOptions = {},
  ): any {
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
    if (options.skipExpiryLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, expiryAbi));
      logs = logs.filter((log: any) => !this.logIsFrom(log, expiryV2Abi));
    }
    if (options.skipRefunderLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, refunderAbi));
    }
    if (options.skipLimitOrdersLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, limitOrdersAbi));
    }
    if (options.skipSignedOperationProxyLogs) {
      logs = logs.filter((log: any) => !this.logIsFrom(log, signedOperationProxyAbi));
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
      case result(this.contracts.soloMargin.options.address, 'toLowerCase'):
      case result(this.contracts.testSoloMargin.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.soloMargin, log);
      }
      case result(this.contracts.expiry.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.expiry, log);
      }
      case result(this.contracts.expiryV2.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.expiryV2, log);
      }
      case result(this.contracts.refunder.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.refunder, log);
      }
      case result(this.contracts.limitOrders.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.limitOrders, log);
      }
      case result(this.contracts.signedOperationProxy.options.address, 'toLowerCase'): {
        return this.parseLogWithContract(this.contracts.signedOperationProxy, log);
      }
    }

    return null;
  }

  private parseLogWithContract(contract: any, log: Log) {
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

  private parseArgs(eventJson: any, eventArgs: any) {
    const parsed = {};

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
        val = this.parseTuple(input, eventArgs);
      } else {
        throw new Error(`Unknown evnt arg type ${input.type}`);
      }
      parsed[input.name] = val;
    });

    return parsed;
  }

  private parseTuple(input: any, eventArgs: any) {
    if (
      Array.isArray(input.components)
      && input.components.length === 2
      && input.components[0].name === 'owner'
      && input.components[1].name === 'number'
    ) {
      return this.parseAccountInfo(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components)
      && input.components.length === 2
      && input.components[0].name === 'deltaWei'
      && input.components[1].name === 'newPar'
    ) {
      return this.parseBalanceUpdate(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components)
      && input.components.length === 3
      && input.components[0].name === 'borrow'
      && input.components[1].name === 'supply'
      && input.components[2].name === 'lastUpdate'
    ) {
      return this.parseIndex(eventArgs[input.name]);
    }

    if (
      Array.isArray(input.components)
      && input.components.length === 1
      && input.components[0].name === 'value'
    ) {
      if (
        input.name.toLowerCase().includes('spread')
        || input.name.toLowerCase().includes('ratio')
        || input.name.toLowerCase().includes('rate')
        || input.name.toLowerCase().includes('premium')
      ) {
        return this.parseDecimalValue(eventArgs[input.name]);
      }
      return this.parseIntegerValue(eventArgs[input.name]);
    }

    throw new Error('Unknown tuple type in event');
  }

  private parseAccountInfo(
    accountInfo: any,
  ): {
    owner: address,
    number: BigNumber,
  } {
    return {
      owner: accountInfo.owner,
      number: new BigNumber(accountInfo.number),
    };
  }

  private parseIndex(index: any): Index {
    return {
      borrow: stringToDecimal(index.borrow),
      supply: stringToDecimal(index.supply),
      lastUpdate: new BigNumber(index.lastUpdate),
    };
  }

  private parseBalanceUpdate(update: any): BalanceUpdate {
    return {
      deltaWei: valueToInteger(update.deltaWei),
      newPar: valueToInteger(update.newPar),
    };
  }

  private parseDecimalValue(value: any): Decimal {
    return stringToDecimal(value.value);
  }

  private parseIntegerValue(value: any): Integer {
    return new BigNumber(value.value);
  }
}
