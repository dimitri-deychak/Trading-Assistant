import { ClosePosition, Order, PlaceOrder } from '@master-chief/alpaca';
import { Request, Response } from 'express';

import { alpacaClient } from '../alpacaClient';
import {
  IListenerExitRule,
  IPosition,
  IRawTradeEntry,
  ListenerExitSide,
  PositionStatus,
} from '../../shared/interfaces';
import { API_KEY_ID, SECRET_KEY, PAPER_API_KEY_ID, PAPER_SECRET_KEY } from '../config';

export const getEnvironmentHandler = async (_: Request, res: Response) => {
  res.send({ API_KEY_ID, SECRET_KEY, PAPER_API_KEY_ID, PAPER_SECRET_KEY });
};

export const newPositionCallback = async (req: Request, res: Response) => {
  try {
    const rawTradeEntry: IRawTradeEntry = req.body;

    const position = await initiatePositionFromRawTradeEntry(rawTradeEntry);

    // db.set(position.symbol, position);
    res.send(position);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
};

const initiatePositionFromRawTradeEntry = async (rawTradeEntry: IRawTradeEntry): Promise<IPosition> => {
  const { entryPrice, stopPrice, newSymbol, riskInDollars, deRiskTargetMultiple } = rawTradeEntry;

  //ToDo: add this as option to FE
  const HARDCODED_PERCENT_TO_DE_RISK = 33.33;

  const distanceFromEntryToStop = Math.abs(entryPrice - stopPrice);

  const rMultipleTargetPrice = entryPrice + deRiskTargetMultiple * distanceFromEntryToStop;

  const oneThirdDistanceFromEntryTo1R = (1 / 3) * (entryPrice + distanceFromEntryToStop);

  const limitPrice = entryPrice + oneThirdDistanceFromEntryTo1R;

  const notionalValue = Math.floor(riskInDollars / (entryPrice - stopPrice)) * entryPrice;

  const totalQuantity = notionalValue / entryPrice;

  const alpacaBuyOrder: PlaceOrder = {
    symbol: newSymbol,
    side: 'buy',
    type: 'stop_limit',
    time_in_force: 'gtc',
    stop_price: entryPrice,
    limit_price: Number(limitPrice.toFixed(2)),
    qty: totalQuantity,
  };

  const deRiskTargetListener = {
    side: ListenerExitSide.TAKE_PROFIT,
    triggerPrice: rMultipleTargetPrice,
    closeOrder: {
      symbol: newSymbol,
      percentage: HARDCODED_PERCENT_TO_DE_RISK,
    } as ClosePosition,
  };

  const stopLossListener = {
    side: ListenerExitSide.STOP,
    triggerPrice: stopPrice,
    closeOrder: { symbol: newSymbol, percentage: 100 } as ClosePosition,
  };

  const buyOrder = await alpacaClient.placeOrder(alpacaBuyOrder);

  const entryRule = {
    buyOrder,
    listenersToActivate: [deRiskTargetListener, stopLossListener],
  };

  return {
    status: PositionStatus.QUEUED,
    symbol: newSymbol,
    entryRule,
    activeListeners: [] as IListenerExitRule[],
    inactiveListeners: [] as IListenerExitRule[],
  };
};
