import { AlpacaClient, DefaultCredentials } from '@master-chief/alpaca';
import { API_KEY_ID, SECRET_KEY } from './config';

export const alpacaClient = new AlpacaClient({
  credentials: {
    key: API_KEY_ID,
    secret: SECRET_KEY,
  } as DefaultCredentials,
  rate_limit: false,
});
