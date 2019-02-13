import { TxResult } from '../types';

// For solidity function calls that violate require()
export async function expectThrow(promise: Promise<TxResult>, reason?: string) {
  try {
    await promise;
    throw new Error('Did not throw');
  } catch (e) {
    assertCertainError(e, 'Exception while processing transaction: revert');
    if (reason && process.env.COVERAGE !== 'true') {
      assertCertainError(e, reason);
    }
  }
}

// For solidity function calls that violate assert()
export async function expectAssertFailure(promise: Promise<TxResult>) {
  try {
    await promise;
    throw new Error('Did not throw');
  } catch (e) {
    assertCertainError(e, 'Exception while processing transaction: invalid opcode');
  }
}

// Helper function
function assertCertainError(error: Error, expected_error_msg?: string) {
  // This complication is so that the actual error will appear in truffle test output
  const message = error.message;
  const matchedIndex = message.search(expected_error_msg);
  let matchedString = message;
  if (matchedIndex >= 0) {
    matchedString = message.substring(matchedIndex, matchedIndex + expected_error_msg.length);
  }
  expect(matchedString).toEqual(expected_error_msg);
}
