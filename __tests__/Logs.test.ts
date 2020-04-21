import { getSolo } from './helpers/Solo';
import { TestSolo } from './modules/TestSolo';
let solo: TestSolo;

describe('Logs', () => {
  beforeAll(async () => {
    const r = await getSolo();
    solo = r.solo;
  });

  it('Succeeds in parsing txResult.logs', async () => {
    const txResult = {
      logs: [
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          blockHash: '0x81441018c1131afd6f7ceec2077257f4ecfc3325d56b375bf370008d17a20d65',
          blockNumber: 7492404,
          data: '0x00000000000000000000000000000000000000000000000000038d7ea4c68000',
          logIndex: 119,
          removed: false,
          topics: [
            '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
            '0x0000000000000000000000006e86dc68723d9811f67d9f6acfec6ec9d3818527',
          ],
          transactionHash: '0xfbb9bc794809a190e7a18278181128d53ed41cec7bf34667e7052edfbff8ad69',
          transactionIndex: 152,
          transactionLogIndex: '0x0',
          type: 'mined',
          id: 'log_21ca9c63',
        },
        {
          address: solo.contracts.testSoloMargin.options.address,
          blockHash: '0x81441018c1131afd6f7ceec2077257f4ecfc3325d56b375bf370008d17a20d65',
          blockNumber: 7492404,
          data: '0x0000000000000000000000006e86dc68723d9811f67d9f6acfec6ec9d3818527',
          logIndex: 120,
          removed: false,
          topics: [
            '0x91b01baeee3a24b590d112613814d86801005c7ef9353e7fc1eaeaf33ccf83b0',
          ],
          transactionHash: '0xfbb9bc794809a190e7a18278181128d53ed41cec7bf34667e7052edfbff8ad69',
          transactionIndex: 152,
          transactionLogIndex: '0x1',
          type: 'mined',
          id: 'log_0ffe7292',
        },
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          blockHash: '0x81441018c1131afd6f7ceec2077257f4ecfc3325d56b375bf370008d17a20d65',
          blockNumber: 7492404,
          data: '0x00000000000000000000000000000000000000000000000000038d7ea4c68000',
          logIndex: 122,
          removed: false,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x0000000000000000000000006e86dc68723d9811f67d9f6acfec6ec9d3818527',
            '0x00000000000000000000000022cb2d5de2009c9afd321bdf8759743665e45844',
          ],
          transactionHash: '0xfbb9bc794809a190e7a18278181128d53ed41cec7bf34667e7052edfbff8ad69',
          transactionIndex: 152,
          transactionLogIndex: '0x3',
          type: 'mined',
          id: 'log_e4f19380',
        },
        {
          address: solo.contracts.testSoloMargin.options.address,
          blockHash: '0x81441018c1131afd6f7ceec2077257f4ecfc3325d56b375bf370008d17a20d65',
          blockNumber: 7492404,
          data: '0x0000000000000000000000000000000000000000000000000000000000000000' +
                  '0000000000000000000000000000000000000000000000000000000000000000' +
                  '0000000000000000000000000000000000000000000000000000000000000001' +
                  '00000000000000000000000000000000000000000000000000038d7ea4c68000' +
                  '0000000000000000000000000000000000000000000000000000000000000001' +
                  '00000000000000000000000000000000000000000000000000038d7ea4c68000' +
                  '0000000000000000000000006e86dc68723d9811f67d9f6acfec6ec9d3818527',
          logIndex: 123,
          removed: false,
          topics: [
            '0x2bad8bc95088af2c247b30fa2b2e6a0886f88625e0945cd3051008e0e270198f',
            '0x0000000000000000000000006a08b12aa520d319768e0d3a779af8660794c5e1',
          ],
          transactionHash: '0xfbb9bc794809a190e7a18278181128d53ed41cec7bf34667e7052edfbff8ad69',
          transactionIndex: 152,
          transactionLogIndex: '0x4',
          type: 'mined',
          id: 'log_9aab3f86',
        },
      ],
    };
    const logs = solo.logs.parseLogs((txResult as any));
    expect(logs.length).not.toEqual(0);
  });

});
