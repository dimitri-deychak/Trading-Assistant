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

  let newBarsLastPtr = tradeBars.length - 1;
  let fiftySmaLastPtr = smaValues.length - 1;
  while (newBarsLastPtr >= 0 && fiftySmaLastPtr >= 0) {
    tradeBars[newBarsLastPtr].fiftySMA = formatNumber(smaValues[fiftySmaLastPtr]);
    newBarsLastPtr--;
    fiftySmaLastPtr--;
  }

  return { sma: smaValues, tradeBars };
};

export const getTa = async (type: string, symbol: string, length: number): Promise<TAReturnValue> => {
  switch (type) {
    case 'SMA': {
      const sma = await getSMA(symbol, length);
      return sma;
    }
  }
};
