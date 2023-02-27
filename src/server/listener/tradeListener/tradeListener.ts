import { AlpacaStream, Trade } from '@master-chief/alpaca';
import { IPosition, PositionStatus } from '../../../shared/interfaces';
import { ALPACA_API_KEYS, IS_DEV_ALPACA } from '../../config';
import { db } from '../../database';
import { enqueue } from '../queue';
import { latestPriceHandler } from './latestPriceHandlers';
import { findCommonElements } from '../../../shared/utils';
import { setPriceInterval } from '../intervals';

const { API_KEY_ID, SECRET_KEY } = ALPACA_API_KEYS;

export let tradeStream;

export const initiateTradeStream = () => {
  tradeStream =
    !IS_DEV_ALPACA &&
    new AlpacaStream({
      credentials: {
        key: API_KEY_ID,
        secret: SECRET_KEY,
        paper: IS_DEV_ALPACA,
      },
      type: 'market_data',
      source: 'sip',
    });

  if (tradeStream) {
    tradeStream.once('authenticated', async () => {
      console.log('Trade stream authenticated');
      enqueue(async () => updateTradePriceSubscriptionsToAccountPositions());
    });

    tradeStream.on('trade', async (trade: Trade) => {
      enqueue(async () => {
        await handleNewTrade(trade);
      });
    });

    tradeStream.on('subscription', (message) => {
      const { T } = message;
      if (T === 'subscription') {
        console.log(message);
      }
    });
  }
};

// const testSymbols = ['SPY', 'QQQ', 'AMZN', 'NFLX', 'AAPL'];

export const updateTradePriceSubscriptionsToAccountPositions = () => {
  const symbolsToSubscribeTo = getSymbolsToSubscribeTo();
  if (tradeStream) {
    tradeStream.subscribe('trades', symbolsToSubscribeTo);
  } else {
    setPriceInterval();
  }
};

const onlyOpenPositionsFilter = (position: IPosition) =>
  [PositionStatus.OPEN, PositionStatus.RUNNER].includes(position.status);

export const getSymbolsToSubscribeTo = () => {
  return db
    .getAccountPositions()
    .filter(onlyOpenPositionsFilter)
    .map((position) => position.symbol);
};

const exclude_conditions = ['B', 'W', '4', '7', '9', 'C', 'G', 'H', 'I', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'V', 'Z'];
export const handleNewTrade = async (trade: Trade) => {
  try {
    const excludeTrade = findCommonElements(exclude_conditions, trade.c);
    if (excludeTrade) {
      console.log('Excluding trade', trade.c.toString(), trade.p);
      return;
    }

    console.log(`Begin Handler for ${trade.S}. Price: ${trade.p}`);
    await latestPriceHandler(trade);
    console.log(`End Handler for ${trade.S}`);
  } catch (e) {
    console.error(e);
  }
};
