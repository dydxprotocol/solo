var Web3 = require('web3');
require('dotenv-flow').config();
var provider = new Web3.providers.HttpProvider(process.env.RPC_NODE_URI);
provider.send({
    method: 'evm_snapshot',
    params: [],
    jsonrpc: '2.0',
    id: new Date().getTime(),
}, function () { process.exit(0); });
//# sourceMappingURL=snapshot-test-evm.js.map