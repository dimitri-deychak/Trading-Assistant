import React, { ChangeEvent, useState, VFC } from 'react';
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
import TradingViewWidget from 'react-tradingview-widget';
import { formatNumber } from '../../shared/utils';

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
}) => {
  return (
    <Box sx={{ display: 'flex', height: '100%', gap: '16px', alignItems: 'center' }}>
      <Box sx={{ flex: 3, height: '90%' }}>
        <TradingViewWidget symbol={symbol} autosize show_bottom_toolbar={true} locale='en' hide_side_toolbar={false} />
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

type NewTradeModalProps = {
  onConfirm: (rawTradeEntry: IRawTradeEntry) => void;
  onCancel: () => void;
};

export const NewTradeModal: VFC<NewTradeModalProps> = ({ onConfirm, onCancel }) => {
  const [newSymbol, setNewSymbol] = useState<string>();
  const [entryPrice, setEntryPrice] = useState<number>();
  const [stopPrice, setStopPrice] = useState<number>();
  const [riskInDollars, setRiskInDollars] = useState<number>();
  const [deRiskTargetMultiple, setDeRiskTargetMultiple] = useState<number>();

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
