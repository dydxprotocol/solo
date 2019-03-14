const REQUIRE_MSG = 'VM Exception while processing transaction: revert';
const ASSERT_MSG = 'VM Exception while processing transaction: invalid opcode';

// For solidity function calls that violate require()
export async function expectThrow(promise: Promise<any>, reason?: string) {
  try {
    await promise;
    throw new Error('Did not throw');
  } catch (e) {
    assertCertainError(e, REQUIRE_MSG);
    if (reason && process.env.COVERAGE !== 'true') {
      assertCertainError(e, `${REQUIRE_MSG} ${reason}`);
    }
  }
}

// For solidity function calls that violate assert()
export async function expectAssertFailure(promise: Promise<any>) {
  try {
    await promise;
    throw new Error('Did not throw');
  } catch (e) {
    assertCertainError(e, ASSERT_MSG);
  }
}

function assertCertainError(error: Error, expected_error_msg?: string) {
  const message = error.message;

  expect(message).toMatch(expected_error_msg);
}
