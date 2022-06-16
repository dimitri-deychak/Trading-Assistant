import { alpacaClient } from '../../alpacaClient';
import { Bar, BarsTimeframe, Trade } from '@master-chief/alpaca';
import { BarsJsonResponse, getTradeBars } from '../../../shared/getBars';
import { LatestTrade } from '@master-chief/alpaca/@types/entities';
import { stringify } from 'csv-stringify/sync';

export const fetchBarsCSV = async (symbols: string[], startDate: Date, endDate: Date, timeframe: BarsTimeframe) => {
  const promises: [any[]] = [['symbol', 'time', 'open', 'high', 'low', 'volume']];
  for (const symbol of symbols) {
    promises.push(
      ...(await getTradeBars(alpacaClient, symbol, startDate, endDate, timeframe)).map((bar) => [
        symbol,
        bar.t,
        bar.o,
        bar.h,
        bar.l,
        bar.v,
      ]),
    );
  }
  return promises;
};

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
