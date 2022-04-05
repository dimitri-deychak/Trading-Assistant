import React, { ChangeEvent, useEffect, useState, VFC } from 'react';
import { PlaceOrder } from '@master-chief/alpaca';
import {
  FormGroup,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  DialogContent,
  CardMedia
} from '@mui/material';
import { IRawTradeEntry } from '../../shared/interfaces';
import TradingViewWidget from 'react-tradingview-widget';
import { TradeForm } from './TradeForm';

type NewTradeProps = {
  newSymbol: string | undefined;
  entryPrice: number | undefined;
  stopPrice: number | undefined;
  deRiskTargetMultiple: number | undefined;
  riskInDollars: number | undefined;

  onSetNewSymbol: (symbol: string) => void;
  onSetEntryPrice: (price: number) => void;
  onSetStopPrice: (stop: number) => void;
  onSetDeRiskTargetMultiple: (multiple: number) => void;
  onSetRiskInDollars: (risk: number) => void;
};

export const NewTradeEntryForm: VFC<NewTradeProps> = ({
  newSymbol,
  entryPrice,
  stopPrice,
  deRiskTargetMultiple,
  riskInDollars,
  onSetDeRiskTargetMultiple,
  onSetNewSymbol,
  onSetEntryPrice,
  onSetStopPrice,
  onSetRiskInDollars
}) => {
  const onSymbolTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    onSetNewSymbol(event.target.value.toUpperCase());

  const onEntryPriceTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    onSetEntryPrice(Number(event.target.value));

  const onStopPriceTextFieldChange = (event: ChangeEvent<HTMLInputElement>) =>
    onSetStopPrice(Number(event.target.value));

  const onRiskInDollarsTextFieldChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => onSetRiskInDollars(Number(event.target.value));

  const onDeRiskTargetMultipleTextFieldChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => onSetDeRiskTargetMultiple(Number(event.target.value));

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flex: 7, height: '90%' }}>
        <TradingViewWidget
          symbol={newSymbol}
          autosize
          show_bottom_toolbar={true}
          locale="en"
          hide_side_toolbar={false}
        />
      </Box>

      <TradeForm
        symbol={newSymbol}
        entryPrice={entryPrice}
        stopPrice={stopPrice}
        deRiskTargetMultiple={deRiskTargetMultiple}
        riskInDollars={riskInDollars}
        onSymbolTextFieldChange={onSymbolTextFieldChange}
        onEntryPriceTextFieldChange={onEntryPriceTextFieldChange}
        onStopPriceTextFieldChange={onStopPriceTextFieldChange}
        onRiskInDollarsTextFieldChange={onRiskInDollarsTextFieldChange}
        onDeRiskTargetMultipleTextFieldChange={
          onDeRiskTargetMultipleTextFieldChange
        }
      />
    </Box>
  );
};

type NewTradeModalProps = {
  onConfirm: (rawTradeEntry: IRawTradeEntry) => void;
  onCancel: () => void;
};

export const NewTradeModal: VFC<NewTradeModalProps> = ({
  onConfirm,
  onCancel
}) => {
  const [newSymbol, setNewSymbol] = useState<string>();
  const [entryPrice, setEntryPrice] = useState<number>();
  const [stopPrice, setStopPrice] = useState<number>();
  const [deRiskTargetMultiple, setDeRiskTargetMultiple] = useState<number>();
  const [riskInDollars, setRiskInDollars] = useState<number>();

  const handleOnConfirm = () => {
    const allFieldsEntered =
      newSymbol &&
      entryPrice &&
      stopPrice &&
      deRiskTargetMultiple &&
      riskInDollars;
    if (!allFieldsEntered) {
      return;
    }

    onConfirm({
      newSymbol,
      entryPrice,
      stopPrice,
      deRiskTargetMultiple,
      riskInDollars
    });
  };

  return (
    <Dialog open={true} fullScreen>
      <DialogTitle>Add new trade</DialogTitle>
      <DialogContent>
        <NewTradeEntryForm
          newSymbol={newSymbol}
          onSetNewSymbol={setNewSymbol}
          entryPrice={entryPrice}
          onSetEntryPrice={setEntryPrice}
          stopPrice={stopPrice}
          onSetStopPrice={setStopPrice}
          deRiskTargetMultiple={deRiskTargetMultiple}
          onSetDeRiskTargetMultiple={setDeRiskTargetMultiple}
          riskInDollars={riskInDollars}
          onSetRiskInDollars={setRiskInDollars}
        ></NewTradeEntryForm>
      </DialogContent>
      <DialogActions sx={{ display: 'flex' }}>
        <Button sx={{ flex: 1 }} onClick={onCancel}>
          Cancel
        </Button>
        <Button sx={{ flex: 1 }} onClick={handleOnConfirm}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
