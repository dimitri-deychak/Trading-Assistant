import { Clock } from '@master-chief/alpaca';
import { getCST } from '../../shared/utils';
import { alpacaClient } from '../alpacaClient';
import { getTa } from '../ta/ta';
import { fetchAccountActivities } from './accountListener/accountListener';
import { enqueue } from './queue';
import { fetchLatestTrades } from './tradeListener/fetchPrices';
import { getSymbolsToSubscribeTo, handleNewTrade } from './tradeListener/tradeListener';

let priceIntervalStagingId: NodeJS.Timer;
let accountIntervalId: NodeJS.Timer;
let clockIntervalId: NodeJS.Timer;
export let clock: Clock;

export const clearPriceInterval = () => {
  if (priceIntervalStagingId) {
    console.log('clearing price interval', priceIntervalStagingId);
    clearInterval(priceIntervalStagingId);
  }
};

export const clearAccountInterval = () => {
  if (accountIntervalId) {
    console.log('clearing account interval', accountIntervalId);
    clearInterval(accountIntervalId);
  }
};

export const clearClockInterval = () => {
  if (clockIntervalId) {
    console.log('clearing clock interval', clockIntervalId);
    clearInterval(clockIntervalId);
  }
};

export const setClockInterval = async () => {
  clearClockInterval();

  clockIntervalId = setInterval(() => {
    enqueue(async () => {
      try {
        console.log('Fetching clock');
        clock = await alpacaClient.getClock();
      } catch (e) {
        console.log('Error fetching clock from server', e);
        return;
      }
    });
  }, 10000);
};

export const setPriceInterval = () => {
  clearPriceInterval();

  const symbols = getSymbolsToSubscribeTo();
  priceIntervalStagingId = setInterval(() => {
    enqueue(async () => {
      console.log('Fetching Latest Trades for ', symbols);
      const latestTrades = await fetchLatestTrades(symbols);
      for (const trade of latestTrades) {
        await handleNewTrade(trade);
      }
    });
  }, 500);
};

export const setAccountInterval = () => {
  clearAccountInterval();

  accountIntervalId = setInterval(async () => {
    enqueue(async () => {
      await fetchAccountActivities();
    });
  }, 2500);
};
