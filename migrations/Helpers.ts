export function isDevNetwork(network: string): boolean {
  return network === 'development'
          || network === 'test'
          || network === 'develop'
          || network === 'dev'
          || network === 'docker'
          || network === 'coverage';
}

export function isMainNet(network: string): boolean {
  return network === 'mainnet';
}

export function isKovan(network: string): boolean {
  return network === 'kovan';
}

export const MULTISIG = {
  KOVAN: {
  },
  MAINNET: {
  },
};
