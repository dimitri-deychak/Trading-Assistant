import { Bar } from '@master-chief/alpaca';
import { IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Ref } from 'react';
import { CustomBar, IPosition, ListenerExitSide } from '../../../shared/interfaces';

export const addFiftySma = (chart: IChartApi, bars: CustomBar[]) => {
  const smaLine = chart.addLineSeries({
    color: 'rgba(4, 111, 232, 1)',
    lineWidth: 2,
  });
  const data = [];
  bars.forEach((bar: CustomBar) => {
    if (bar.fiftySMA) {
      data.push({ time: new Date(bar.t).toLocaleString(), value: bar.fiftySMA });
    }
  });
  smaLine.setData(data);
  return smaLine;
};
export const addCandlestickBars = (chart: IChartApi, data: Bar[], position?: IPosition) => {
  const newSeriesOptions = {
    priceScaleId: 'right',
    priceLineVisible: false,

    borderVisible: true,
    wickVisible: true,
    borderColor: '#000000',
    wickColor: '#000000',

    upColor: '#009688',
    downColor: '#ef5350',
    borderUpColor: 'black',
    borderDownColor: 'black',
    wickUpColor: 'black',
    wickDownColor: 'black',
  };

  const priceData = data.map(({ t, o, h, l, c }) => ({
    time: t.toLocaleString(),
    open: o,
    high: h,
    low: l,
    close: c,
  }));

  const newSeries = chart.addCandlestickSeries(newSeriesOptions);

  newSeries.setData(priceData);
  if (position) {
    addMarkersToSeries(newSeries, position);
  }

  if (chart.timeScale().getVisibleRange()) {
    const sixMonthsAgo = subtractMonths(6);
    const now = new Date();
    const range = {
      from: { day: sixMonthsAgo.getDate(), month: sixMonthsAgo.getMonth() + 1, year: sixMonthsAgo.getFullYear() },
      to: { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() },
    };

    chart.timeScale().setVisibleRange(range);
    chart.applyOptions({ timeScale: { rightOffset: 12 } });
  }

  return newSeries;
};

export const addVolumeBars = (chart: IChartApi, data: Bar[]) => {
  const newSeriesOptions = {
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: '',
    scaleMargins: {
      top: 0.8,
      bottom: 0,
    },
    color: '#26a69a',

    upColor: '#009688',
    downColor: '#ef5350',
    priceLineVisible: false,
  };

  const volumeData = data.map(({ t, v, o, c }) => ({
    time: t.toLocaleString(),
    value: v,
    color: c > o ? '#009688' : '#ef5350',
  }));

  const newSeries = chart.addHistogramSeries(newSeriesOptions);

  newSeries.setData(volumeData);

  return newSeries;
};

const addMarkersToSeries = (series: ISeriesApi<'Candlestick'>, position: IPosition) => {
  const markers = [];
  const { buyOrder } = position.entryRule;
  const { filled_at, filled_avg_price, filled_qty } = position.entryRule?.order || {};
  const lineWidth = 2;

  if (filled_at && filled_avg_price && filled_qty) {
    markers.push({
      time: filled_at,
      position: 'belowBar',
      color: '#2196F3',
      shape: 'arrowUp',
      text: `Buy ${filled_qty} shares @ ${filled_avg_price}`,
    });
  } else {
    const { stop_price, limit_price } = buyOrder;
    const entryLine = {
      price: stop_price,
      color: '#0044ff',
      lineWidth,
      lineStyle: LineStyle.LargeDashed,
      axisLabelVisible: true,
      //   title: 'Entry',
    };

    const limitLine = {
      price: limit_price,
      color: '#0044ff',
      lineWidth,
      lineStyle: LineStyle.LargeDashed,
      axisLabelVisible: true,
      //   title: 'Limit',
    };

    series.createPriceLine(entryLine);
    series.createPriceLine(limitLine);
  }

  const { activeListeners, inactiveListeners } = position;

  for (const inactiveListener of inactiveListeners) {
    const isStopOrder = inactiveListener.side === ListenerExitSide.STOP;
    const { filled_at, filled_avg_price, filled_qty } = inactiveListener?.order || {};

    if (filled_at && filled_avg_price && filled_qty) {
      markers.push({
        time: filled_at,
        position: 'aboveBar',
        color: isStopOrder ? 'red' : 'green',
        shape: 'arrowDown',
        text: `Sell ${filled_qty} shares @ ${filled_avg_price}`,
      });
    }
  }

  for (const activeListener of activeListeners) {
    const isStopOrder = activeListener.side === ListenerExitSide.STOP;

    const line = {
      price: activeListener.triggerValue,
      color: isStopOrder ? '#ff1100' : '#009688',
      lineWidth,
      lineStyle: LineStyle.LargeDashed,
      axisLabelVisible: true,
      //   title: isStopOrder ? 'Stop' : 'Take Profit',
    };

    series.createPriceLine(line);
  }

  for (const listenerToActivate of position.entryRule.listenersToActivate) {
    const isStopOrder = listenerToActivate.side === ListenerExitSide.STOP;

    const line = {
      price: listenerToActivate.triggerValue,
      color: isStopOrder ? '#ff1100' : '#009688',
      lineWidth,
      lineStyle: LineStyle.LargeDashed,
      axisLabelVisible: true,
      //   title: isStopOrder ? 'Stop' : 'Take Profit',
    };

    series.createPriceLine(line);
  }

  series.setMarkers(markers);
};

function subtractMonths(numMOnths, date = new Date()) {
  date.setMonth(date.getMonth() - numMOnths);
  return date;
}
