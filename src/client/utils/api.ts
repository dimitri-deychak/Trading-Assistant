import { AlpacaClient, DefaultCredentials, Trade } from '@master-chief/alpaca';
import API, { AxiosResponse } from 'axios';
import { IEnv, TAReturnValue } from '../../shared/interfaces';
import { Account, IPosition, IRawTradeEntry } from '../../shared/interfaces';

export const getEnv = async () => {
  const { data: env } = (await API.get('/api/env')) as AxiosResponse<IEnv>;
  return env;
};

export const getAccount = async () => {
  const { data: account } = (await API.get('/api/account')) as AxiosResponse<Account>;
  return account;
};

export const getLastTrade = async (symbol: string) => {
  const { data: lastTrade } = (await API.get(`/api/last-trade?symbol=${symbol}`)) as AxiosResponse<Trade>;
  return lastTrade;
};

export const clearState = async () => {
  const { data: account } = (await API.post('/api/clear-state')) as AxiosResponse<Account>;
  return account;
};

export const submitNewPosition = async (rawTradeEntry: IRawTradeEntry) => {
  const { data: newAccount } = await API.post('/api/new-position', { rawTradeEntry });
  return newAccount as Account;
};

export const updatePosition = async (position: IPosition) => {
  const { data: newAccount } = await API.post('/api/update-position', { position });
  return newAccount as Account;
};

export const removePosition = async (position: IPosition) => {
  const { data: newAccount } = await API.post('/api/remove-position', { position });
  return newAccount as Account;
};

export const getTa = async (type: string, symbol: string, length: number) => {
  const { data: ta } = await API.get(`/api/ta?symbol=${symbol}&type=${type}&length=${length}`);
  return ta as TAReturnValue;
};

export const getAlpacaClient = (env: IEnv) => {
  const { API_KEY_ID, SECRET_KEY, IS_DEV } = env;
  return new AlpacaClient({
    credentials: {
      key: API_KEY_ID,
      secret: SECRET_KEY,
      paper: true,
    } as DefaultCredentials,
    rate_limit: false,
  });
};
