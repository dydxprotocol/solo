import { solo } from './Solo';

export async function resetEVM() {
  await solo.testing.evm.resetEVM(process.env.RESET_SNAPSHOT_ID);
}
