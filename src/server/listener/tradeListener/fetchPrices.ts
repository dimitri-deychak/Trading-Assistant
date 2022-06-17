import { alpacaClient } from '../../alpacaClient';
import { Bar, BarsTimeframe, Trade } from '@master-chief/alpaca';
import { getTradeBars } from '../../../shared/getBars';
import { LatestTrade } from '@master-chief/alpaca/@types/entities';

export const fetchBars = (symbols: string[], startDate: Date, endDate: Date, timeframe: BarsTimeframe) => {
  const promises: Promise<Bar[]>[] = [];
  for (const symbol of symbols) {
    promises.push(getTradeBars(alpacaClient, symbol, startDate, endDate, timeframe));
  }
  return Promise.all(promises);
};

export const fetchLatestTrades = async (symbols: string[]) => {
  const promises: Promise<LatestTrade>[] = [];
  for (const symbol of symbols) {
    promises.push(alpacaClient.getLatestTrade({ symbol }));
  }

  const resolvedPromises = await Promise.all(promises);
  const trades: Trade[] = [];
  for (const resolvedPromise of resolvedPromises) {
    const trade = { ...resolvedPromise.trade, S: resolvedPromise.symbol } as Trade;
    trades.push(trade);
  }
  return trades;
};
