import { ClosePosition, PlaceOrder } from '@master-chief/alpaca';
import { Request, Response } from 'express';

import { alpacaClient } from '../alpacaClient';
import {
  IListenerExitRule,
  IListenerSimpleTargetExitRule,
  IPosition,
  IRawTradeEntry,
  ListenerExitSide,
  ListenerQuantityType,
  ListenerTimeRule,
  ListenerTriggerType,
  PositionStatus,
} from '../../shared/interfaces';
import { ALPACA_API_KEYS, IS_DEV } from '../config';
import { db } from '../database';
import { enqueue } from '../listener/queue';
import { updateTradePriceSubscriptionsToAccountPositions } from '../listener/tradeListener/tradeListener';

export const getEnvironmentHandler = async (_: Request, res: Response) => {
  res.send({ ...ALPACA_API_KEYS, IS_DEV });
};

export const getLastTradeHandler = async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    if (symbol) {
      const lastTrade = await alpacaClient.getLastTrade_v1({ symbol });
      res.send({ lastTrade });
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
};

export const newPositionHandler = async (req: Request, res: Response) => {
  enqueue(async () => {
    try {
      const { rawTradeEntry } = req.body as { rawTradeEntry: IRawTradeEntry };
      const position = await initiatePositionFromRawTradeEntry(rawTradeEntry);
      const newAccount = await db.putAccountPosition(position);
      updateTradePriceSubscriptionsToAccountPositions();
      res.send(newAccount);
    } catch (e) {
      console.error(e);
      res.sendStatus(400);
    }
  });
};

export const updatePositionHandler = async (req: Request, res: Response) => {
  enqueue(async () => {
    try {
      const { position } = req.body as { position: IPosition };
      const newAccount = await db.putAccountPosition(position);
      res.send(newAccount);
    } catch (e) {
      console.error(e);
      res.sendStatus(400);
    }
  });
};

export const getAccountHandler = async (_: Request, res: Response) => {
  try {
    const account = db.getAccount();
    res.send(account);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
};

const initiatePositionFromRawTradeEntry = async (rawTradeEntry: IRawTradeEntry): Promise<IPosition> => {
  const { entryPrice, stopPrice, newSymbol, riskInDollars, deRiskTargetMultiple } = rawTradeEntry;

  //ToDo: add this as option to FE
  const ONE_THIRD = 1 / 3;

  const distanceFromEntryToStop = Math.abs(entryPrice - stopPrice);

  const rMultipleTargetPrice = entryPrice + deRiskTargetMultiple * distanceFromEntryToStop;

  const oneThirdDistanceFromEntryTo1R = ONE_THIRD * distanceFromEntryToStop;

  const limitPrice = entryPrice + oneThirdDistanceFromEntryTo1R;

  const notionalValue = Math.floor(riskInDollars / (entryPrice - stopPrice)) * entryPrice;

  const totalQuantity = Math.round(notionalValue / entryPrice);

  const alpacaBuyOrder: PlaceOrder = {
    symbol: newSymbol,
    side: 'buy',
    type: 'stop_limit',
    time_in_force: 'gtc',
    stop_price: Number(entryPrice.toFixed(2)),
    limit_price: Number(limitPrice.toFixed(2)),
    qty: totalQuantity,
  };

  const deRiskTargetListener: IListenerSimpleTargetExitRule = {
    triggerType: ListenerTriggerType.PRICE,
    timeRule: ListenerTimeRule.AS_SOON_AS_TRIGGER_OCCURS,
    side: ListenerExitSide.TAKE_PROFIT,
    triggerValue: rMultipleTargetPrice,
    breakEvenOnRest: true,
    closeOrder: {
      symbol: newSymbol,
      percentage: ONE_THIRD * 100,
    } as ClosePosition,
  };

  const stopLossListener = {
    triggerType: ListenerTriggerType.PRICE,
    timeRule: ListenerTimeRule.AS_SOON_AS_TRIGGER_OCCURS,
    side: ListenerExitSide.STOP,
    triggerValue: stopPrice,
    closeOrder: { symbol: newSymbol, percentage: 100 } as ClosePosition,
  };

  try {
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
      positionQty: 0,
    };
  } catch (e) {
    console.error('Error submitting trade', e);
  }
};

export const clearStateHandler = async (_: Request, res: Response) => {
  enqueue(async () => {
    try {
      await alpacaClient.closePositions({ cancel_orders: true });
      await db.resetAccount();
      const newAccount = db.getAccount();
      res.send({ newAccount });
    } catch (e) {
      console.error(e);
      res.sendStatus(400);
    }
  });
};

export const cancelAndClosePosition = (req: Request, res: Response) => {
  enqueue(async () => {
    try {
      const {
        position: { symbol },
      } = req.body as { position: IPosition };

      const account = db.getAccount();
      const { positions } = account;

      const position = positions.find((position) => position.symbol === symbol);
      if (!position) {
        throw new Error('Position not found, can not cancel');
      }

      const ordersOnServer = await alpacaClient.getOrders({ symbols: [symbol], status: 'open' });

      for (const orderOnServer of ordersOnServer) {
        await alpacaClient.cancelOrder({ order_id: orderOnServer.id });
      }

      if (position.positionQty > 0) {
        await alpacaClient.closePosition({ symbol });
      }

      const newAccount = await db.removePositionFromAccountBySymbol(symbol);

      res.send(newAccount);
    } catch (e) {
      console.error(e);
      res.sendStatus(400);
    }
  });
};