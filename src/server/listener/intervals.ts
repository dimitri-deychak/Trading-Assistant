import { fetchAccountActivities } from './accountListener/accountListener';
import { enqueue } from './queue';
import { fetchLatestTrades } from './tradeListener/fetchPrices';
import { getSymbolsToSubscribeTo, handleNewTrade } from './tradeListener/tradeListener';

let priceIntervalStagingId: NodeJS.Timer;
let accountIntervalId: NodeJS.Timer;

export const clearPriceInterval = () => {
  if (priceIntervalStagingId) {
    clearInterval(priceIntervalStagingId);
  }
};

export const clearAccountInterval = () => {
  if (accountIntervalId) {
    clearInterval(accountIntervalId);
  }
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
  }, 1000);
};

export const setAccountInterval = () => {
  clearAccountInterval();

  accountIntervalId = setInterval(() => {
    enqueue(async () => await fetchAccountActivities());
  }, 1000);
};
