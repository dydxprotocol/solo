import { dolomiteMargin } from './DolomiteMargin';

export async function resetEVM(id?: string) {
  await dolomiteMargin.testing.evm.resetEVM(id || process.env.RESET_SNAPSHOT_ID);
}

export async function mineAvgBlock() {
  // Increase time so that tests must update the index
  await dolomiteMargin.testing.evm.increaseTime(15);
  await dolomiteMargin.testing.evm.mineBlock();
}

export async function snapshot() {
  return dolomiteMargin.testing.evm.snapshot();
}

export async function fastForward(seconds: number) {
  await dolomiteMargin.testing.evm.increaseTime(seconds);
  await dolomiteMargin.testing.evm.mineBlock();
}
