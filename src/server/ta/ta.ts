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
const functions = talib.functions;
for (const i in functions) {
  console.log(functions[i].name);
}

// Keltner Channel Calculation
// \begin{aligned} &\text{Keltner Channel Middle Line} = EMA\\ &\text{Keltner Channel Upper Band} = EMA + 2*ATR\\ &\text{Keltner Channel Lower Band} = EMA - 2*ATR\\ &\textbf{where:}\\ &EMA = \text{Exponential moving average (typically over 20 periods)}\\ &ATR = \text{Average True Range (typically over 10 or 20 periods)} \end{aligned}
// ​

// Keltner Channel Middle Line=EMA
// Keltner Channel Upper Band=EMA+2∗ATR
// Keltner Channel Lower Band=EMA−2∗ATR
// where:
// EMA=Exponential moving average (typically over 20 periods)
// ATR=Average True Range (typically over 10 or 20 periods)
// ​

export const getSqueeze = async (symbol: string): Promise<TAReturnValue> => {
  // var function_desc = talib.explain("BBANDS");
  // return function_desc

  const hourlySqueeze = await getHourlySqueeze(symbol);
  return {
    squeeze: { hourly: { ...hourlySqueeze } },
  };
};
export const getHourlySqueeze = async (symbol: string) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);
  const tradeBars = (await getTradeBars(alpacaClient, symbol, startDate, endDate, '1Hour')) as CustomBar[];

  if (tradeBars.length < 1) {
    throw new Error('Can not calculate bbands bc no data');
  }
  const closes = tradeBars.map((tradeBar: Bar) => tradeBar.c);
  const highs = tradeBars.map((tradeBar: Bar) => tradeBar.h);
  const lows = tradeBars.map((tradeBar: Bar) => tradeBar.l);

  const bbandsOut = talib.execute({
    name: 'BBANDS',
    inReal: closes,
    startIdx: 0,
    endIdx: closes.length - 1,
    optInTimePeriod: 20,
    optInNbDevUp: 2,
    optInNbDevDn: 2,
    optInMAType: 0,
  });

  const emaOut = talib.execute({
    name: 'EMA',
    startIdx: 0,
    endIdx: closes.length - 1,
    inReal: closes,
    optInTimePeriod: 20,
  });

  const atrOut = talib.execute({
    name: 'ATR',
    startIdx: 0,
    endIdx: closes.length - 1,
    high: highs,
    low: lows,
    close: closes,
    optInTimePeriod: 20,
  });

  // return {bbandsOut, atrOut, emaOut} as any

  const {
    result: { outRealUpperBand, outRealLowerBand },
  } = bbandsOut;
  const {
    result: { outReal: ema },
  } = emaOut;
  const {
    result: { outReal: atr },
  } = atrOut;
  let bbandsLastPtr = outRealUpperBand.length - 1;
  let atrLastPtr = atr.length - 1;
  let emaLastPtr = ema.length - 1;
  const squeeze = [];
  while (bbandsLastPtr >= 0 && atrLastPtr >= 0 && emaLastPtr >= 0) {
    const upperKeltnerChannel = ema[emaLastPtr] + 2 * atr[atrLastPtr];
    const lowerKeltnerChannel = ema[emaLastPtr] - 2 * atr[atrLastPtr];
    const upperBBandsWithinKC = outRealUpperBand[bbandsLastPtr] <= upperKeltnerChannel;
    const lowerBBandsWithinKC = outRealLowerBand[bbandsLastPtr] >= lowerKeltnerChannel;
    squeeze.push(Boolean(upperBBandsWithinKC && lowerBBandsWithinKC));
    bbandsLastPtr--;
    atrLastPtr--;
    emaLastPtr--;
  }

  return {
    hourlySqueeze: squeeze,
    hourlyTradeBars: tradeBars,
    inHourlySqueezeNow: squeeze[squeeze.length - 1],
    atr,
    ema,
    outRealUpperBand,
    outRealLowerBand,
  };
};

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
    case 'EMA': {
    }
    case 'TTM_SQUEEZE': {
      const squeeze = await getSqueeze(symbol);
      return squeeze;
    }
  }
};
