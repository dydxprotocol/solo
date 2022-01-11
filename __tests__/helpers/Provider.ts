import Web3 from 'web3';

// eslint-disable-next-line import/prefer-default-export
export const provider = new Web3.providers.HttpProvider(
  process.env.RPC_NODE_URI,
);
