import { AlpacaStream } from '@master-chief/alpaca';
import { latestPriceHandler } from './listenerHandlers/latestPriceHandlers';
import { accountTradeUpdatesHandler } from './listenerHandlers/accountTradeHandlers';
import { API_KEY_ID, SECRET_KEY } from '../config';
import { getAccountStateFromS3 } from '../database';

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

export const beginStream = async () => {
  const { positions } = await getAccountStateFromS3();
  tradeStream.once('authenticated', () => {
    const symbolsToSubscribeTo = positions.map((position) => position.symbol);
    tradeStream.subscribe('trades', symbolsToSubscribeTo);
    tradeStream.on('trade', latestPriceHandler);
  });
  accountStream.once('authenticated', () => {
    accountStream.subscribe('trade_updates');
    accountStream.on('trade_updates', accountTradeUpdatesHandler);
  });
};
