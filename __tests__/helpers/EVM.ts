import { solo } from './Solo';

export async function resetEVM() {
  await solo.testing.evm.resetEVM(process.env.RESET_SNAPSHOT_ID);
}

export async function mineAvgBlock() {
  // Increase time so that tests must update the index
  await solo.testing.evm.increaseTime(15);
  await solo.testing.evm.mineBlock();
}
