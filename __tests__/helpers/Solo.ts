import { NETWORK_ID } from './Constants';
import { Solo } from '../../src/Solo';
import { provider } from './Provider';

export const solo = new Solo(provider, NETWORK_ID);
