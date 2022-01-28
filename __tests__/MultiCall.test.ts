import { getDolomiteMargin } from './helpers/DolomiteMargin';
import { TestDolomiteMargin } from './modules/TestDolomiteMargin';
import { resetEVM, snapshot } from './helpers/EVM';
import { setupMarkets } from './helpers/DolomiteMarginHelpers';

let dolomiteMargin: TestDolomiteMargin;

describe('MultiCall', () => {
  let snapshotId: string;

  beforeAll(async () => {
    const r = await getDolomiteMargin();
    dolomiteMargin = r.dolomiteMargin;
    const accounts = r.accounts;

    await resetEVM();
    await setupMarkets(dolomiteMargin, accounts);

    snapshotId = await snapshot();
  });

  beforeEach(async () => {
    await resetEVM(snapshotId);
  });

  it('works for a call', async () => {
    const calls = ['0', '1'].map(marketId => {
      return {
        target: dolomiteMargin.contracts.dolomiteMargin.options.address,
        callData: dolomiteMargin.contracts.dolomiteMargin.methods.getMarketPrice(marketId).encodeABI(),
      };
    });
    const results = (await dolomiteMargin.multiCall.aggregate(calls)).results;
    const priceResults = results.map(p => dolomiteMargin.web3.eth.abi.decodeParameters(['uint256'], p));
    priceResults.forEach(results => {
      expect(results[0]).toEqual('10000000000000000000000000000000000000000');
    });
  });

  it('works for a call that returns many results', async () => {
    const calls = ['0', '1'].map(marketId => {
      return {
        target: dolomiteMargin.contracts.dolomiteMargin.options.address,
        callData: dolomiteMargin.contracts.dolomiteMargin.methods.getMarketCurrentIndex(marketId).encodeABI(),
      };
    });
    const results = (await dolomiteMargin.multiCall.aggregate(calls)).results;
    const indexResults = results.map(p => dolomiteMargin.web3.eth.abi.decodeParameters(
      ['uint256', 'uint256', 'uint256'], p)
    );
    const blockTimestamp = (await dolomiteMargin.web3.eth.getBlock('latest')).timestamp;
    indexResults.forEach(results => {
      expect(results[0]).toEqual('1000000000000000000');
      expect(results[1]).toEqual('1000000000000000000');
      expect(results[2]).toEqual(blockTimestamp.toString());
    });
  });
});
