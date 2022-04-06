import { AlpacaClient, DefaultCredentials } from '@master-chief/alpaca';
import API, { AxiosResponse } from 'axios';
import { IEnv } from '../../shared/IEnv';
import { Account } from '../../shared/interfaces';

export const getEnv = async () => {
  const { data: env } = (await API.get('/api/env')) as AxiosResponse<IEnv>;
  console.log({ env });
  return env;
};

export const getAccount = async () => {
  const { data: account } = (await API.get('/api/account')) as AxiosResponse<Account>;
  return account;
};

export const getAlpacaClient = (env: IEnv) => {
  const { API_KEY_ID, SECRET_KEY, IS_DEV } = env;
  console.log({ API_KEY_ID });
  return new AlpacaClient({
    credentials: {
      key: API_KEY_ID,
      secret: SECRET_KEY,
      // paper: !!IS_DEV,
    } as DefaultCredentials,
    rate_limit: false,
  });
};
