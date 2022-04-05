import { AlpacaStream } from '@master-chief/alpaca';
import { db } from '../database';
import { latestPriceHandler } from './listenerHandlers/latestPriceHandlers';
import { accountTradeUpdatesHandler } from './listenerHandlers/accountTradeHandlers';
import { API_KEY_ID, SECRET_KEY } from '../config';

export const tradeStream = new AlpacaStream({
  credentials: {
    key: API_KEY_ID,
    secret: SECRET_KEY,
    paper: false,
  },
  type: 'market_data',
});

export const accountStream = new AlpacaStream({
  credentials: {
    key: API_KEY_ID,
    secret: SECRET_KEY,
    paper: false,
  },
  type: 'account',
});

export const beginStream = () => {
  tradeStream.once('authenticated', () => {
    const symbolsToSubscribeTo = ['AAPL']; //Object.keys(db.JSON());
    tradeStream.subscribe('trades', symbolsToSubscribeTo);
    tradeStream.on('trade', latestPriceHandler);
  });
  accountStream.once('authenticated', () => {
    accountStream.subscribe('trade_updates');
    accountStream.on('trade_updates', accountTradeUpdatesHandler);
  });
};
