import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { BarPrice, BarPrices, ColorType, createChart, CrosshairMode, ISeriesApi } from 'lightweight-charts';
import { addCandlestickBars, addVolumeBars, addMovingAverages } from './TvChartUtils';
import { Bar } from '@master-chief/alpaca';
import { CustomBar, IPosition } from '../../../shared/interfaces';

export const useCreateChart = (
  chartContainerRef: MutableRefObject<HTMLDivElement>,
  height: number,
  width: number,
  bars: Bar[],

  setLegendText: Dispatch<SetStateAction<string>>,
  position?: IPosition,
  onClick?: (time: string, price: number, priceSeries: ISeriesApi<'Candlestick'>) => void,
) => {
  const chart = createChart(chartContainerRef.current, {
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    timeScale: {
      rightOffset: 12,
      barSpacing: 8,
      fixLeftEdge: true,
      lockVisibleTimeRangeOnResize: true,
      rightBarStaysOnScroll: true,
      borderVisible: false,
      borderColor: '#fff000',
      visible: true,
      timeVisible: true,
      secondsVisible: false,
    },
    layout: {
      background: {
        type: ColorType.VerticalGradient,
        topColor: 'rgb(224, 237, 251)',
        bottomColor: 'rgb(255, 255, 255)',
      },
    },

    grid: {
      vertLines: {
        color: 'rgba(70, 130, 180, 0.5)',
        style: 1,
        visible: false,
      },
      horzLines: {
        color: 'rgba(70, 130, 180, 0.5)',
        style: 1,
        visible: false,
      },
    },
    width,
    height,
  });

  debugger;
  const priceSeries = addCandlestickBars(chart, bars, position);
  const { sma50Line, ema21Line, ema10Line } = addMovingAverages(chart, bars);
  const volumeSeries = addVolumeBars(chart, bars);

  if (chartContainerRef?.current) {
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const price = param.seriesPrices.get(priceSeries) as BarPrices;
        const sma50 = param.seriesPrices.get(sma50Line);
        const ema21 = param.seriesPrices.get(ema21Line);
        const ema10 = param.seriesPrices.get(ema10Line);
        const volume = param.seriesPrices.get(volumeSeries) as BarPrice;
        const { open, high, low, close } = price;
        setLegendText(
          generateLegendText({
            o: open,
            h: high,
            l: low,
            c: close,
            v: volume,
            sma50,
            ema21,
            ema10,
          } as unknown as CustomBar),
        );
      } else {
        const lastBar = bars[bars.length - 1];

        setLegendText(generateLegendText(lastBar));
      }
    });

    if (onClick) {
      chart.subscribeClick((param) => {
        console.log(chart.timeScale());
        const timestamp = chart.timeScale().coordinateToLogical(param.point.x);
        const price = priceSeries.coordinateToPrice(param.point.y);
        console.log({ param, timestamp, price });
        onClick(String(timestamp), price, priceSeries);
      });
    }
  }

  return { chart };
};

export const generateLegendText = (priceBar: CustomBar) => {
  try {
    const { o: open, h: high, l: low, c: close, v: volume, sma50, ema21, ema10 } = priceBar;
    const formattedVolume = volume.toLocaleString(
      undefined, // leave undefined to use the visitor's browser
      // locale or a string like 'en-US' to override it.
      { minimumFractionDigits: 0 },
    );

    let base = `Open: ${open} - High: ${high} - Low: ${low} - Close: ${close} - Volume: ${formattedVolume}`;

    if (sma50) {
      base += ` - SMA(50): ${sma50} `;
    }

    if (ema21) {
      base += ` - EMA(21): ${ema21} `;
    }

    if (ema10) {
      base += ` - EMA(10): ${ema10} `;
    }

    return base;
  } catch (e) {
    return '';
  }
};
