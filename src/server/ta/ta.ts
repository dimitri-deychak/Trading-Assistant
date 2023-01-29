// load the module and display its version
import { alpacaClient } from '../alpacaClient';
import { getTradeBars } from '../../shared/getBars';
import { Bar } from '@master-chief/alpaca';
import { TAReturnValue } from '../../shared/interfaces';
import { CustomBar } from '../../shared/interfaces';
import { formatNumber } from '../../shared/utils';
const talib = require('talib');
console.log('TALib Version: ' + talib.version);

// Display all available indicator function names
// const functions = talib.functions;
// for (const i in functions) {
//   console.log(functions[i].name);
// }

export const getSMA = async (symbol: string, length: number): Promise<TAReturnValue> => {
  const startDate = new Date(null);
  const endDate = new Date();
  const tradeBars = (await getTradeBars(alpacaClient, symbol, startDate, endDate, '1Day')) as CustomBar[];
  if (tradeBars.length < 1) {
    throw new Error('Can not calculate moving avg bc no data');
  }
  const closes = tradeBars.map((tradeBar: Bar) => tradeBar.c);

  const smaOut = talib.execute({
    name: 'SMA',
    startIdx: 0,
    endIdx: closes.length - 1,
    inReal: closes,
    optInTimePeriod: length,
  });
  const smaValues = smaOut.result.outReal;

  return { sma: smaValues };
};

export const getEMA = async (symbol: string, length: number): Promise<TAReturnValue> => {
  const startDate = new Date(null);
  const endDate = new Date();
  const tradeBars = (await getTradeBars(alpacaClient, symbol, startDate, endDate, '1Day')) as CustomBar[];
  if (tradeBars.length < 1) {
    throw new Error('Can not calculate moving avg bc no data');
  }
  const closes = tradeBars.map((tradeBar: Bar) => tradeBar.c);

  const emaOut = talib.execute({
    name: 'EMA',
    startIdx: 0,
    endIdx: closes.length - 1,
    inReal: closes,
    optInTimePeriod: length,
  });
  const emaValues = emaOut.result.outReal;

  return { ema: emaValues };
};

export const getTa = async (type: string, symbol: string, length: number): Promise<TAReturnValue> => {
  switch (type) {
    case 'SMA': {
      const sma = await getSMA(symbol, length);
      return sma;
    }
    case 'EMA': {
      const ema = await getEMA(symbol, length);
      return ema;
    }
  }
};

export const getTradeBarsWithTa = async (symbol: string): Promise<CustomBar[]> => {
  const startDate = new Date(null);
  const endDate = new Date();
  const fiftySma = await getTa('SMA', symbol, 50);
  const twentyOneEma = await getTa('EMA', symbol, 21);
  const tenEma = await getTa('EMA', symbol, 10);
  const tradeBars = (await getTradeBars(alpacaClient, symbol, startDate, endDate, '1Day')) as CustomBar[];

  let newBarsLastPtr = tradeBars.length - 1;
  let ema10LastPtr = tenEma.ema.length - 1;
  let ema21LastPtr = twentyOneEma.ema.length - 1;
  let sma50LastPtr = fiftySma.sma.length - 1;
  while (newBarsLastPtr >= 0) {
    tradeBars[newBarsLastPtr].ema10 = formatNumber(tenEma.ema[ema10LastPtr] ?? 0);
    tradeBars[newBarsLastPtr].ema21 = formatNumber(twentyOneEma.ema[ema21LastPtr] ?? 0);
    tradeBars[newBarsLastPtr].sma50 = formatNumber(fiftySma.sma[sma50LastPtr] ?? 0);
    newBarsLastPtr--;
    ema10LastPtr--;
    ema21LastPtr--;
    sma50LastPtr--;
  }

  return tradeBars;
};
