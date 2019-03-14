const Web3 = require('web3');
require('dotenv').config();

const provider = new Web3.providers.HttpProvider(process.env.RPC_NODE_URI);

provider.send(
  'evm_snapshot',
  [],
).then(() => process.exit(0));
