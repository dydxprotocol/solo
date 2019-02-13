import Web3 from 'web3';

export const provider = new Web3.providers.HttpProvider(process.env.RPC_NODE_URI);
