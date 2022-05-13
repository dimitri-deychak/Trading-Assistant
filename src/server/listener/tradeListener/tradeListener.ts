import { AlpacaStream, Trade } from '@master-chief/alpaca';
import { IPosition, PositionStatus } from '../../../shared/interfaces';
import { ALPACA_API_KEYS } from '../../config';
import { db } from '../../database';
import { enqueue } from '../queue';
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

const testSymbols = ['SPY', 'QQQ', 'AMZN', 'NFLX', 'AAPL'];
tradeStream.once('authenticated', async () => {
  if (!db.isInitialized()) {
    await db.init();
  }

  updateTradePriceSubscriptionsToAccountPositions();
});

tradeStream.on('trade', async (trade: Trade) => {
  enqueue(async () => {
    try {
      console.log(`Begin Handler for ${trade.S}. Price: ${trade.p}`);
      await latestPriceHandler(trade);
      console.log(`End Handler for ${trade.S}`);
    } catch (e) {
      console.error(e);
    }
  });
});

tradeStream.on('subscription', (message) => {
  const { T } = message;
  if (T === 'subscription') {
    console.log(message);
  }
});

export const updateTradePriceSubscriptionsToAccountPositions = () => {
  const symbolsToSubscribeTo = db
    .getAccountPositions()
    .filter(onlyOpenPositionsFilter)
    .map((position) => position.symbol);
  tradeStream.subscribe('trades', symbolsToSubscribeTo);
};

const onlyOpenPositionsFilter = (position: IPosition) =>
  [PositionStatus.OPEN, PositionStatus.RUNNER].includes(position.status);
