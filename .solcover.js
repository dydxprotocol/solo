module.exports = {
  compileCommand: 'npm run build',
  copyPackages: ['openzeppelin-solidity', '@dydxprotocol/exchange-wrappers'],
  skipFiles: ['testing/', 'Migrations.sol'],
  testCommand: 'npm run test_cov',
  testrpcOptions: '-d --port 8555 -i 1002 --gasLimit 7900000',
};
