import { solo } from './Solo';

export async function resetEVM(id?: string) {
  await solo.testing.evm.resetEVM(id || process.env.RESET_SNAPSHOT_ID);
}

export async function mineAvgBlock() {
  // Increase time so that tests must update the index
  await solo.testing.evm.increaseTime(15);
  await solo.testing.evm.mineBlock();
}

export async function snapshot() {
  return solo.testing.evm.snapshot();
}

export async function fastForward(seconds: number) {
  await solo.testing.evm.increaseTime(seconds);
  await solo.testing.evm.mineBlock();
}
