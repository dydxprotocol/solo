import { Log, EventLog } from 'web3/types';
import Web3 from 'web3';
import { Contracts } from '../lib/Contracts';
import { TxResult } from '../types';

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
        if (e instanceof Array) {
          e.forEach(ev => events.splice(ev.logIndex, 0, ev));
        } else {
          events.splice(e.logIndex, 0, e);
        }
      });

      return events.map(e => this.parseEvent(e)).filter(l => !!l);
    }

    throw new Error('Receipt has no logs');
  }

  private parseLog(log: Log) {
    switch (log.address) {
      case this.contracts.soloMargin.options.address:
      case this.contracts.testSoloMargin.options.address: {
        const events = this.contracts.soloMargin.options.jsonInterface.filter(
          e => e.type === 'event',
        );

        const eventJson = events.find(
          (e: any) => e.signature.toLowerCase() === log.topics[0].toLowerCase(),
        );

        if (!eventJson) {
          console.log(events.map((e: any) => e.signature))
          console.log(eventJson)
          console.log(log)
          throw new Error('Event type not found');
        }

        return this.web3.eth.abi.decodeLog(
          eventJson,
          log.data,
          log.topics,
        );
      }
    }

    return null;
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
}
