import fs from 'fs';
import { promisify } from 'es6-promisify';
import Web3 from 'web3';
import { bytecode as dolomiteAmmPairBytecode } from '../build/contracts/DolomiteAmmPair.json';
import { bytecode as uniswapV2PairBytecode } from '../build/contracts/UniswapV2Pair.json';

const readFileAsync = promisify(fs.readFile);

const dolomiteAmmLibraryPath = 'contracts/external/lib/DolomiteAmmLibrary.sol';
const uniswapV2LibraryPath = 'contracts/external/uniswap-v2/libraries/UniswapV2Library.sol';

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

  const dolomiteAmmLibrary = (await readFileAsync(dolomiteAmmLibraryPath)).toString();

  const dolomiteAmmMatcher = dolomiteAmmLibrary.match(initCodeRegex);
  if (!dolomiteAmmMatcher) {
    throw new Error('Dolomite init code variable not found!');
  }
  if (dolomiteAmmMatcher[1].toString() !== dolomiteAmmInitCodeHash) {
    throw new Error(`Dolomite init code hash does not match! Expected ${dolomiteAmmInitCodeHash}`);
  }

  const uniswapV2Library = (await readFileAsync(uniswapV2LibraryPath)).toString();

  const uniswapV2Matcher = uniswapV2Library.match(initCodeRegex);
  if (!uniswapV2Matcher) {
    throw new Error('Uniswap init code variable not found!');
  }
  if (uniswapV2Matcher[1].toString() !== uniswapV2InitCodeHash) {
    throw new Error(`Uniswap init code hash does not match! Expected ${uniswapV2InitCodeHash}`);
  }
}

replaceBytecode()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
