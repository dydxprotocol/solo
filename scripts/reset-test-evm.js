const Web3 = require('web3');
require('dotenv-flow').config();

const provider = new Web3.providers.HttpProvider(process.env.RPC_NODE_URI);

provider.send(
  {
    method: 'evm_snapshot',
    params: [],
    jsonrpc: '2.0',
    id: new Date().getTime(),
  },
  function(id) {
    if (id !== '0x1') {
      provider.send(
        {
          method: 'evm_revert',
          params: ['0x1'],
          jsonrpc: '2.0',
          id: new Date().getTime(),
        },
        function() {
          provider.send(
            {
              method: 'evm_snapshot',
              params: [],
              jsonrpc: '2.0',
              id: new Date().getTime(),
            },
            function() { process.exit(0) }
          );
        }
      );
    }
  }
);
