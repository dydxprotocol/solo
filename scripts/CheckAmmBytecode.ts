import Web3 from 'web3';
import { bytecode as dolomiteAmmPairBytecode } from '../build/contracts/DolomiteAmmPair.json';
import { source as dolomiteAmmPairSource } from '../build/contracts/DolomiteAmmLibrary.json';
import { bytecode as uniswapV2PairBytecode } from '../build/contracts/UniswapV2Pair.json';
import { source as uniswapV2PairSource } from '../build/contracts/UniswapV2Library.json';

async function replaceBytecode(): Promise<void> {
  const dolomiteAmmInitCodeHash = Web3.utils.soliditySha3({
    type: 'bytes',
    value: dolomiteAmmPairBytecode,
  });
  const uniswapV2InitCodeHash = Web3.utils.soliditySha3({
    type: 'bytes',
    value: uniswapV2PairBytecode,
  });

  const initCodeRegex = /bytes32 private constant PAIR_INIT_CODE_HASH = (0x[0-9a-fA-F]{64});/;

  let errors: Error[] = [];

  const dolomiteAmmMatcher = dolomiteAmmPairSource.match(initCodeRegex);
  if (!dolomiteAmmMatcher) {
    errors.push(new Error('Dolomite init code variable not found!'));
  }
  if (dolomiteAmmMatcher[1].toString() !== dolomiteAmmInitCodeHash) {
    errors.push(new Error(`Dolomite init code hash does not match! Expected ${dolomiteAmmInitCodeHash}`));
  }

  const uniswapV2Matcher = uniswapV2PairSource.match(initCodeRegex);
  if (!uniswapV2Matcher) {
    errors.push(new Error('Uniswap init code variable not found!'));
  }
  if (uniswapV2Matcher[1].toString() !== uniswapV2InitCodeHash) {
    errors.push(new Error(`Uniswap init code hash does not match! Expected ${uniswapV2InitCodeHash}`));
  }

  if (errors.length > 0) {
    errors.forEach(error => console.error(error.message));
    console.error('');
    return Promise.reject(
      new Error(
        `Bytecode checking encountered ${
          errors.length
        } errors. Please resolve the above error messages to fix the issue(s).`,
      ),
    );
  }

  console.log('All bytecodes match!');
}

replaceBytecode()
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  })
  .then(() => process.exit(0));
