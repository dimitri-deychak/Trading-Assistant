import { AlpacaClient, DefaultCredentials } from '@master-chief/alpaca';
import { ALPACA_API_KEYS, IS_DEV_ALPACA } from './config';

const { API_KEY_ID, SECRET_KEY } = ALPACA_API_KEYS;

export const alpacaClient = new AlpacaClient({
  credentials: {
    key: API_KEY_ID,
    secret: SECRET_KEY,
    paper: IS_DEV_ALPACA,
  } as DefaultCredentials,
  rate_limit: false,
});
