function isDevNetwork(network) {
  return network === 'development'
          || network === 'test'
          || network === 'develop'
          || network === 'dev'
          || network === 'docker'
          || network === 'coverage';
}

function isMainNet(network) {
  return network === "mainnet";
}

function isKovan(network) {
  return network === "kovan";
}

const MULTISIG = {
  KOVAN: {
    PROTOCOL_CONTROLLER : '0xbfee66a97d0be709820f00546875786c21116734',
    TOKEN_CAP_SETTER    : '0xcd22c9cd914af78a645115c7e8ca585f749e1b7d',
    MARGIN_CALLER       : '0x52078043257b83a224a5852b9fad363634fb9320',
    POSITION_CREATOR    : '0x9cb58f39b1a97e60044bc7e889116d3b150df664',
    TOKEN_WITHDRAWER    : '0x47dee8c5570302baea9f05fef9129862e07183bf'
  },
  MAINNET: {
    PROTOCOL_CONTROLLER : '0xfe0108f02b6a080d0f3be74cb354300469e3df4d',
    TOKEN_CAP_SETTER    : '0x06bf832ab7251fea03c6d4f2be954b11eb9f418e',
    MARGIN_CALLER       : '0xbf7e615e440eebacfe15666b5bea774085f4bbed',
    POSITION_CREATOR    : '0x07be6cfa395d9cded31705e12dcfba6276a31e66',
    TOKEN_WITHDRAWER    : '0xc4d43b6844ce4a2b0c25f278126d58f309963547'
  }
}

module.exports = {
  isDevNetwork,
  isMainNet,
  isKovan,
  MULTISIG
};
