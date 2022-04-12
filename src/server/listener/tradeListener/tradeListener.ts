import { AlpacaStream, Trade } from '@master-chief/alpaca';
import { ALPACA_API_KEYS } from '../../config';
import { db } from '../../database';
import { latestPriceHandler } from './latestPriceHandlers';

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
  console.log({ tradeEvent: trade });

  latestPriceHandler(trade);
});

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    tradeStream.getConnection().close();
    console.log('Closed connection');
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true, exit: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { cleanup: true, exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { cleanup: true, exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { cleanup: true, exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { cleanup: true, exit: true }));
