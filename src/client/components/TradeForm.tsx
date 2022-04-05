import React, { ChangeEvent, VFC } from 'react';
import { FormGroup, TextField } from '@mui/material';

type TradeFormProps = {
  symbol: string;
  entryPrice: number;
  stopPrice: number;
  deRiskTargetMultiple: number;
  riskInDollars: number;

  onSymbolTextFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onEntryPriceTextFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onStopPriceTextFieldChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onRiskInDollarsTextFieldChange?: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onDeRiskTargetMultipleTextFieldChange?: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
};

export const TradeForm: VFC<TradeFormProps> = ({
  symbol,
  entryPrice,
  deRiskTargetMultiple,
  riskInDollars,
  stopPrice,
  onSymbolTextFieldChange,
  onEntryPriceTextFieldChange,
  onStopPriceTextFieldChange,
  onRiskInDollarsTextFieldChange,
  onDeRiskTargetMultipleTextFieldChange
}) => {
  return (
    <FormGroup sx={{ display: 'flex', gap: '24px', margin: '24px', flex: 1 }}>
      <TextField
        required
        id="symbol"
        label="Symbol"
        onChange={onSymbolTextFieldChange}
        value={symbol}
        disabled={!onSymbolTextFieldChange}
      ></TextField>
      <TextField
        required
        id="entry-price"
        label="Entry Price"
        type="number"
        onChange={onEntryPriceTextFieldChange}
        value={entryPrice}
        disabled={!onEntryPriceTextFieldChange}
      ></TextField>
      <TextField
        required
        id="stop-price"
        label="Stop Price"
        type="number"
        onChange={onStopPriceTextFieldChange}
        value={stopPrice}
        disabled={!onStopPriceTextFieldChange}
      ></TextField>
      <TextField
        required
        id="risk-in-dollars"
        label="Risk In Dollars"
        type="number"
        onChange={onRiskInDollarsTextFieldChange}
        value={riskInDollars}
        disabled={!onRiskInDollarsTextFieldChange}
      ></TextField>
      <TextField
        required
        id="de-risk-target-multiple"
        label="De Risk Target Multiple"
        type="number"
        onChange={onDeRiskTargetMultipleTextFieldChange}
        value={deRiskTargetMultiple}
        disabled={!onDeRiskTargetMultipleTextFieldChange}
      ></TextField>
    </FormGroup>
  );
};
