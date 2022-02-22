import fs from 'fs';
import { promisify } from 'es6-promisify';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const dolomiteAmmLibraryPath = '.coverage_contracts/external/lib/DolomiteAmmLibrary.sol';
const uniswapV2LibraryPath = '.coverage_contracts/external/uniswap-v2/libraries/UniswapV2Library.sol';

async function replaceBytecode(): Promise<void> {
  const dolomiteAmmInitCodeHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const uniswapV2InitCodeHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  const initCodeRegex = /bytes32 private constant PAIR_INIT_CODE_HASH = (0x[0-9a-fA-F]{64});/;

  const dolomiteAmmLibrary = (await readFileAsync(dolomiteAmmLibraryPath)).toString();

  const dolomiteAmmMatcher = dolomiteAmmLibrary.match(initCodeRegex);
  if (!dolomiteAmmMatcher) {
    throw new Error('Dolomite init code variable not found!');
  }
  await writeFileAsync(
    dolomiteAmmLibraryPath,
    dolomiteAmmLibrary.replace(dolomiteAmmMatcher[1], dolomiteAmmInitCodeHash)
  );

  const uniswapV2Library = (await readFileAsync(uniswapV2LibraryPath)).toString();

  const uniswapV2Matcher = uniswapV2Library.match(initCodeRegex);
  if (!uniswapV2Matcher) {
    throw new Error('Uniswap init code variable not found!');
  }
  await writeFileAsync(
    uniswapV2LibraryPath,
    uniswapV2Library.replace(uniswapV2Matcher[1], uniswapV2InitCodeHash)
  );
}

replaceBytecode()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
