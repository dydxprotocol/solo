import { Log, EventLog } from 'web3/types';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Contracts } from '../lib/Contracts';
import {
  Decimal,
  Integer,
  BalanceUpdate,
  Index,
  TxResult,
} from '../types';
import { stringToDecimal, valueToInteger } from '../lib/Helpers';

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

  public parseLogs(receipt: TxResult): any {
    if (receipt.logs) {
      return receipt.logs.map(l => this.parseLog(l)).filter(l => !!l);
    }
    if (receipt.events) {
      const events = [];

      Object.values(receipt.events).forEach((e) => {
        if (Array.isArray(e)) {
          e.forEach(ev => events.splice(ev.logIndex, 0, ev));
        } else {
          events.splice(e.logIndex, 0, e);
        }
      });

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
    switch (log.address) {
      case this.contracts.soloMargin.options.address:
      case this.contracts.testSoloMargin.options.address: {
        return this.parseLogWithContract(this.contracts.soloMargin, log);
      }
      case this.contracts.expiry.options.address: {
        return this.parseLogWithContract(this.contracts.expiry, log);
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
      console.log(log);
      throw new Error('Event type not found');
    }

    const eventArgs =  this.web3.eth.abi.decodeLog(
      eventJson.inputs,
      log.data,
      log.topics.splice(1),
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
      } else if (input.type === 'bytes') {
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

    console.log(input.components); // TODO: remove

    throw new Error('Unknown tuple type in event');
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
