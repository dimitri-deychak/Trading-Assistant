import React, { ChangeEvent, useState, useContext, VFC, useRef, useEffect, Ref, useCallback } from 'react';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  DialogContent,
  FormControl,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { IRawTradeEntry } from '../../shared/interfaces';
import { TvChart } from './TvChart/TvChart';
import { ClientContext } from '../App';
import { ISeriesApi, LineStyle, PriceLineOptions, IPriceLine } from 'lightweight-charts';
import { useWindowSize } from '../utils/windowSize';
import { formatNumber } from '../../shared/utils';
import { useDebouncedEffect } from '../utils/useDebouncedEffect';

type TradeEntryFormProps = {
  symbol: string;
  setSymbol: (newSymbol: string) => void;
  entryPrice: number;
  setEntryPrice: (entryPrice: number) => void;
  stopPrice: number;
  setStopPrice: (stopPrice: number) => void;
  riskInDollars: number;
  setRiskInDollars: (risk: number) => void;
  deRiskTargetMultiple: number;
  setDeRiskTargetMultiple: (multiple: number) => void;
};

export const EntryForm: VFC<TradeEntryFormProps> = ({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  stopPrice,
  setStopPrice,
  riskInDollars,
  setRiskInDollars,
  deRiskTargetMultiple,
  setDeRiskTargetMultiple,
}) => {
  const onSymbolTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => setSymbol(event.target.value.toUpperCase());
  const onEntryPriceTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    setEntryPrice(Number(event.target.value));

  const onStopPriceTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => setStopPrice(Number(event.target.value));

  const onRiskInDollarsTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    setRiskInDollars(Number(event.target.value));

  const onDeRiskTargetMultipleTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDeRiskTargetMultiple(Number(event.target.value));

  return (
    <Card>
      <CardContent>
        <Typography> Entry </Typography>
        <Stack sx={{ gap: '16px', flexDirection: 'column' }}>
          <FormControl>
            <TextField variant='standard' label='Symbol' value={symbol} onChange={onSymbolTextFieldChange} />
          </FormControl>
          {symbol && (
            <FormControl>
              <TextField
                variant='standard'
                label='Entry price'
                type='number'
                value={formatNumber(entryPrice, false)}
                onChange={onEntryPriceTextFieldChange}
              />
            </FormControl>
          )}
          <FormControl>
            <TextField
              variant='standard'
              label='Entry price'
              type='number'
              value={formatNumber(entryPrice, false)}
              onChange={onEntryPriceTextFieldChange}
            />
          </FormControl>
          <FormControl>
            <TextField
              variant='standard'
              label={'Stop price'}
              type='number'
              value={formatNumber(stopPrice, false)}
              onChange={onStopPriceTextFieldChange}
            />
          </FormControl>
          <FormControl>
            <TextField
              variant='standard'
              label='Risk in dollars'
              type='number'
              value={formatNumber(riskInDollars, false)}
              onChange={onRiskInDollarsTextFieldChange}
            />
          </FormControl>
          <FormControl>
            <TextField
              variant='standard'
              label='De risk target multiple'
              type='number'
              value={formatNumber(deRiskTargetMultiple, false)}
              onChange={onDeRiskTargetMultipleTextFieldChange}
            />
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
};

type NewTradeEntryContentProps = {
  symbol: string;
  setSymbol: (newSymbol: string) => void;
  entryPrice: number;
  setEntryPrice: (entryPrice: number) => void;
  stopPrice: number;
  setStopPrice: (stopPrice: number) => void;
  riskInDollars: number;
  setRiskInDollars: (risk: number) => void;
  deRiskTargetMultiple: number;
  setDeRiskTargetMultiple: (multiple: number) => void;
  onClick?: (time: string, price: number, series: ISeriesApi<'Candlestick'>) => void;
};

export const NewTradeEntryContent: VFC<NewTradeEntryContentProps> = ({
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  stopPrice,
  setStopPrice,
  riskInDollars,
  setRiskInDollars,
  deRiskTargetMultiple,
  setDeRiskTargetMultiple,
  onClick,
}) => {
  const client = useContext(ClientContext);
  const { height, width } = useWindowSize();
  const chartWidth = width * (4 / 5);
  const chartHeight = height - 200;
  const [chartSymbol, setChartSymbol] = useState(symbol);

  useDebouncedEffect(
    () => {
      if (symbol) {
        setChartSymbol(symbol);
      }
    },
    [symbol],
    350,
  );
  return (
    <Box sx={{ display: 'flex', height: '100%', gap: '16px', alignItems: 'center' }}>
      <Box sx={{ flex: 3 }}>
        <TvChart client={client} symbol={chartSymbol} onClick={onClick} height={chartHeight} width={chartWidth} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <EntryForm
          symbol={symbol}
          setSymbol={setSymbol}
          entryPrice={entryPrice}
          setEntryPrice={setEntryPrice}
          stopPrice={stopPrice}
          setStopPrice={setStopPrice}
          riskInDollars={riskInDollars}
          setRiskInDollars={setRiskInDollars}
          deRiskTargetMultiple={deRiskTargetMultiple}
          setDeRiskTargetMultiple={setDeRiskTargetMultiple}
        />
      </Box>
    </Box>
  );
};

type PriceLines = {
  entry?: IPriceLine;
  stop?: IPriceLine;
  t1?: IPriceLine;
  t2?: IPriceLine;
  t3?: IPriceLine;
};

type NewTradeModalProps = {
  onConfirm: (rawTradeEntry: IRawTradeEntry) => void;
  onCancel: () => void;
};

export const NewTradeModal: VFC<NewTradeModalProps> = ({ onConfirm, onCancel }) => {
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopPrice, setStopPrice] = useState<number>(0);
  const [riskInDollars, setRiskInDollars] = useState<number>(100);
  const [deRiskTargetMultiple, setDeRiskTargetMultiple] = useState<number>(1);
  const isEntryClickRef = useRef<boolean>(true);
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick'>>();
  const priceLines = useRef<PriceLines>({});

  const onClick = (timestamp: string, price: number, priceSeries: ISeriesApi<'Candlestick'>) => {
    priceSeriesRef.current = priceSeries;

    if (price && isEntryClickRef.current === true) {
      clearChart();
      setEntryPrice(price);
      setStopPrice(undefined);
    }

    if (price && isEntryClickRef.current === false) {
      setStopPrice(price);
    }

    isEntryClickRef.current = !isEntryClickRef.current;
  };

  const clearChart = () => {
    priceLines.current.entry && priceSeriesRef.current.removePriceLine(priceLines.current.entry);
    priceLines.current.stop && priceSeriesRef.current.removePriceLine(priceLines.current.stop);
    priceLines.current.t1 && priceSeriesRef.current.removePriceLine(priceLines.current.t1);
    priceLines.current.t2 && priceSeriesRef.current.removePriceLine(priceLines.current.t2);
    priceLines.current.t3 && priceSeriesRef.current.removePriceLine(priceLines.current.t3);
  };

  const drawRiskRewardLines = (priceSeries: ISeriesApi<'Candlestick'>, entryPrice: number, stopPrice?: number) => {
    clearChart();
    const line: PriceLineOptions = {
      price: entryPrice,
      color: '#0044ff',
      lineWidth: 2,
      lineStyle: LineStyle.LargeDashed,
      axisLabelVisible: true,
      lineVisible: true,
      title: '',
    };
    priceLines.current.entry = priceSeries.createPriceLine(line);

    if (stopPrice) {
      const deltaBetweenEntryAndStop = Math.abs(entryPrice - stopPrice);

      const stopLine: PriceLineOptions = {
        price: stopPrice,
        color: '#ff1100',
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        lineVisible: true,
        title: '',
      };

      const targetR1Line: PriceLineOptions = {
        price: entryPrice + deltaBetweenEntryAndStop * 1,
        color: '#009688',
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        lineVisible: true,
        title: '',
      };
      const targetR2Line: PriceLineOptions = {
        price: entryPrice + deltaBetweenEntryAndStop * 2,
        color: '#009688',
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        lineVisible: true,
        title: '',
      };
      const targetR3Line: PriceLineOptions = {
        price: entryPrice + deltaBetweenEntryAndStop * 3,
        color: '#009688',
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        lineVisible: true,
        title: '',
      };
      priceLines.current.stop = priceSeries.createPriceLine(stopLine);
      priceLines.current.t1 = priceSeries.createPriceLine(targetR1Line);
      priceLines.current.t2 = priceSeries.createPriceLine(targetR2Line);
      priceLines.current.t3 = priceSeries.createPriceLine(targetR3Line);
    }
  };

  useEffect(() => {
    priceSeriesRef.current && drawRiskRewardLines(priceSeriesRef.current, entryPrice, stopPrice);
  }, [entryPrice, stopPrice, priceSeriesRef]);

  const allFieldsEntered =
    newSymbol && entryPrice && stopPrice && deRiskTargetMultiple && riskInDollars && entryPrice > stopPrice;

  const handleOnConfirm = () => {
    onConfirm({
      newSymbol,
      entryPrice,
      stopPrice,
      deRiskTargetMultiple,
      riskInDollars,
    });
  };

  return (
    <Dialog open={true} fullScreen>
      <DialogTitle>Add new trade</DialogTitle>
      <DialogContent>
        <NewTradeEntryContent
          symbol={newSymbol}
          setSymbol={setNewSymbol}
          entryPrice={entryPrice}
          setEntryPrice={setEntryPrice}
          stopPrice={stopPrice}
          setStopPrice={setStopPrice}
          deRiskTargetMultiple={deRiskTargetMultiple}
          setDeRiskTargetMultiple={setDeRiskTargetMultiple}
          riskInDollars={riskInDollars}
          setRiskInDollars={setRiskInDollars}
          onClick={onClick}
        />
      </DialogContent>
      <DialogActions sx={{ display: 'flex' }}>
        <Button sx={{ flex: 1 }} variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
        <Button sx={{ flex: 1 }} variant='outlined' onClick={handleOnConfirm} disabled={!allFieldsEntered}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
