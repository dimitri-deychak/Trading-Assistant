import { AlpacaStream } from '@master-chief/alpaca';
import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
import { ALPACA_API_KEYS } from '../../config';
import { db } from '../../database';
import { enqueue } from '../queue';
import { accountTradeUpdatesHandler } from './accountTradeHandlers';

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

accountStream.on('trade_updates', async (tradeUpdate: TradeUpdate) => {
  enqueue(async () => {
    try {
      console.log(`Begin trade update handler for ${tradeUpdate.order.symbol}`);
      console.log({ tradeUpdate });
      await accountTradeUpdatesHandler(tradeUpdate);
      console.log(`End trade update handler for ${tradeUpdate.order.symbol}`);
    } catch (e) {
      console.error(e);
    }
  });
});

accountStream.on('subscription', (message) => {
  const { T } = message;
  if (T === 'subscription') {
    console.log(message);
  }
});
