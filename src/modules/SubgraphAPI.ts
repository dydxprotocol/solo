import { default as axios } from 'axios';

const DEFAULT_API_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/dolomite-exchange/dolomite-v2-mumbai';
const DEFAULT_API_TIMEOUT = 10000;
const defaultMethod = 'POST';

export class SubgraphAPI {
  private endpoint: string;
  private timeout: number;

  constructor(
    endpoint: string = DEFAULT_API_ENDPOINT,
    timeout: number = DEFAULT_API_TIMEOUT,
  ) {
    this.endpoint = endpoint;
    this.timeout = timeout;
  }

  // TODO
  async foo(): Promise<string> {
    return axios.request({
      url: this.endpoint,
      timeout: this.timeout,
      method: defaultMethod,
    });
  }
}
