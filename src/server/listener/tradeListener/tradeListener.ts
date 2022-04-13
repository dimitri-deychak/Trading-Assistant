import { AlpacaStream, Trade } from '@master-chief/alpaca';
import { ALPACA_API_KEYS } from '../../config';
import { db } from '../../database';
import { latestPriceHandler } from './latestPriceHandlers';

let currentPromise = Promise.resolve();
const enqueue = (promise: (value: void) => void | PromiseLike<void>) => (currentPromise = currentPromise.then(promise));

export const tradeStream = new AlpacaStream({
  credentials: {
    key: ALPACA_API_KEYS.API_KEY_ID,
    secret: ALPACA_API_KEYS.SECRET_KEY,
    paper: true,
  },
  type: 'market_data',
  source: 'sip',
});

tradeStream.once('authenticated', async () => {
  if (!db.isInitialized()) {
    await db.init();
  }

  const symbolsToSubscribeTo = db.getAccountPositions().map((position) => position.symbol);
  tradeStream.subscribe('trades', symbolsToSubscribeTo);
});

tradeStream.on('trade', async (trade: Trade) => {
  enqueue(async () => {
    console.log(`Begin Handler for ${trade.S}`);
    await latestPriceHandler(trade);
    console.log(`End Handler for ${trade.S}`);
  });
});

tradeStream.on('subscription', (message) => {
  const { T } = message;
  if (T === 'subscription') {
    console.log(message);
  }
});
