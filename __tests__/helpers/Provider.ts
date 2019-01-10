import Web3 from 'web3';

export const provider = new Web3.providers.WebsocketProvider(process.env.WS_NODE_URI);
