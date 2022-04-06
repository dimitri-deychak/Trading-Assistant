import { AlpacaStream } from '@master-chief/alpaca';
import { latestPriceHandler } from './listenerHandlers/latestPriceHandlers';
import { accountTradeUpdatesHandler } from './listenerHandlers/accountTradeHandlers';
import { ALPACA_API_KEYS, IS_DEV } from '../config';
import { db } from '../database';

export const tradeStream = new AlpacaStream({
  credentials: {
    key: ALPACA_API_KEYS.API_KEY_ID,
    secret: ALPACA_API_KEYS.SECRET_KEY,
    paper: IS_DEV,
  },
  type: 'market_data',
});

export const accountStream = new AlpacaStream({
  credentials: {
    key: ALPACA_API_KEYS.API_KEY_ID,
    secret: ALPACA_API_KEYS.SECRET_KEY,
    paper: IS_DEV,
  },
  type: 'account',
});

export const beginStream = async () => {
  await db.init();
  tradeStream.once('authenticated', () => {
    const symbolsToSubscribeTo = db.getAccountPositions().map((position) => position.symbol);
    tradeStream.subscribe('trades', symbolsToSubscribeTo);
    tradeStream.on('trade', latestPriceHandler);
  });
  accountStream.once('authenticated', () => {
    accountStream.subscribe('trade_updates');
    accountStream.on('trade_updates', accountTradeUpdatesHandler);
  });
};
