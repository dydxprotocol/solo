const TruffleContract = require("truffle-contract");
const TestExchangeWrapperJSON =
  require('@dydxprotocol/exchange-wrappers/build/contracts/TestExchangeWrapper.json');
const TestExchangeWrapper = TruffleContract(TestExchangeWrapperJSON);

module.exports = {
  TestExchangeWrapper,
};
