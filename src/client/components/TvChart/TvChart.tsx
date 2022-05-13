import React, { useEffect, useRef, useState, VFC } from 'react';
import Chart from 'kaktana-react-lightweight-charts';
import { AlpacaClient, Bar } from '@master-chief/alpaca';
import { getTradeBars } from '../../utils/getBars';
import { getAlpacaClient } from '../../utils/api';
import { PriceScaleMode, Time, ISeriesApi } from 'lightweight-charts';
import { createChart, ColorType } from 'lightweight-charts';
import { addCandlestickBars, addVolumeBars } from './TvChartUtils';
import { generateLegendText, useCreateChart } from './useCreateChart';
import { IPosition } from '../../../shared/interfaces';
import { Typography } from '@mui/material';

type TvChartProps = {
  client: AlpacaClient;
  position?: IPosition;
  symbol?: string;
  timeFrame?: string; //make enum
  onClick?: (time: string, price: number, priceSeries: ISeriesApi<'Candlestick'>) => void;
};

function subtractYears(numOfYears, date = new Date()) {
  date.setFullYear(date.getFullYear() - numOfYears);
  return date;
}

export const TvChart: VFC<TvChartProps> = ({ client, position, symbol, timeFrame = '1Day', onClick }) => {
  const chartContainerRef = useRef<HTMLDivElement>();
  const [bars, setBars] = useState([] as Bar[]);
  const [legendText, setLegendText] = useState<string>('');
  const now = new Date();
  const fourYearsAgo = subtractYears(4);
  useEffect(() => {
    const _symbol = position?.symbol || symbol;

    const hydrateBars = async () => {
      const newBars = await getTradeBars(client, _symbol, fourYearsAgo, now, timeFrame);

      setBars(newBars);
      setLegendText(generateLegendText(newBars[newBars.length - 1]));

      console.log({ newBars });
    };

    hydrateBars();
  }, [position, symbol, timeFrame]);

  useEffect(() => {
    const { chart } = useCreateChart(chartContainerRef, bars, setLegendText, position, onClick);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef?.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [bars]);

  return (
    <>
      <Typography variant='h6' noWrap component='div' sx={{ flex: 1, width: '100%' }}>
        {legendText}
      </Typography>
      <div ref={chartContainerRef} />
    </>
  );
};
