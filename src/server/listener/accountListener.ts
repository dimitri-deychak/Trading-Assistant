import { AlpacaStream } from '@master-chief/alpaca';
import { ALPACA_API_KEYS } from '../config';
import { db } from '../database';
import { accountTradeUpdatesHandler } from './listenerHandlers/accountTradeHandlers';

export const accountStream = new AlpacaStream({
  credentials: {
    key: ALPACA_API_KEYS.API_KEY_ID,
    secret: ALPACA_API_KEYS.SECRET_KEY,
    paper: true,
  },
  type: 'account',
});

accountStream.once('authenticated', async () => {
  if (!db.isInitialized()) {
    await db.init();
  }

  accountStream.subscribe('trade_updates');
});
