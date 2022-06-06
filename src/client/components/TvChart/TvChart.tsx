import React, { useEffect, useRef, useState, VFC } from 'react';
import { AlpacaClient, Bar } from '@master-chief/alpaca';
import { getAlpacaClient, getTa } from '../../utils/api';
import { PriceScaleMode, Time, ISeriesApi } from 'lightweight-charts';
import { createChart, ColorType } from 'lightweight-charts';
import { addCandlestickBars, addVolumeBars } from './TvChartUtils';
import { generateLegendText, useCreateChart } from './useCreateChart';
import { CustomBar, IPosition } from '../../../shared/interfaces';
import { Typography } from '@mui/material';
import { getTradeBars } from '../../../shared/getBars';

type TvChartProps = {
  client: AlpacaClient;
  height: number;
  width: number;
  position?: IPosition;
  symbol?: string;
  timeFrame?: string; //make enum
  onClick?: (time: string, price: number, priceSeries: ISeriesApi<'Candlestick'>) => void;
};

function subtractYears(numOfYears, date = new Date()) {
  date.setFullYear(date.getFullYear() - numOfYears);
  return date;
}

export const TvChart: VFC<TvChartProps> = ({
  client,
  height,
  width,
  position,
  symbol,
  timeFrame = '1Day',
  onClick,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>();
  const [bars, setBars] = useState([] as CustomBar[]);
  const [legendText, setLegendText] = useState<string>('');
  useEffect(() => {
    const _symbol = position?.symbol || symbol;

    const hydrateBars = async () => {
      const { sma: newFiftySMA, tradeBars: newBars } = await getTa('SMA', _symbol, 50);


      // test
      if (newBars) {
        setBars(newBars);
        setLegendText(generateLegendText(newBars[newBars.length - 1]));
      }


      console.log({ newBars, newFiftySMA });
    };

    hydrateBars();
  }, [position, symbol, timeFrame]);

  useEffect(() => {
    const { chart } = useCreateChart(chartContainerRef, height, width, bars, setLegendText, position, onClick);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef?.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [bars, height]);

  return (
    <>
      <Typography variant='h6' noWrap component='div' sx={{ flex: 1, width: '100%' }}>
        {legendText}
      </Typography>
      <div ref={chartContainerRef} />
    </>
  );
};
