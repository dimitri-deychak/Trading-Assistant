import { Trade, Order } from '@master-chief/alpaca';
import {
  IPosition,
  IListenerExitRule,
  ListenerExitSide,
  ListenerTimeRule,
  ListenerTriggerType,
} from '../../../shared/interfaces';
import { alpacaClient } from '../../alpacaClient';
import { db } from '../../database';
import { tradeStream } from './tradeListener';
import { getCST } from '../../../shared/utils';
import { getTa } from '../../ta/ta';
import { setPriceInterval } from '../intervals';
import { isWithinOneMinuteOfMarketClose } from '../clock';

export const latestPriceHandler = async (trade: Trade) => {
  const { p: tradePrice, S: symbol } = trade;

  if (!tradePrice || !symbol) {
    return;
  }

  try {
    const positionState = db.getAccountPosition(symbol);

    if (!positionState) {
      console.log(`Unsubscribing from stream for ${symbol}.`);
      if (tradeStream) {
        tradeStream.unsubscribe('trades', [symbol]);
      } else {
        //reset price interval with new positions state
        setPriceInterval();
      }

      return;
    }

    // process all activeListeners
    const { activeListeners } = positionState;
    if (activeListeners.length > 0) {
      for (const activeListener of positionState.activeListeners) {
        await processActiveListener(positionState, activeListener, tradePrice);
      }
    }
  } catch (e) {
    console.log(`Error occurred in latestPriceHandler for ${symbol}`, e.message);
  }
};

const processActiveListener = async (
  positionState: IPosition,
  activeListener: IListenerExitRule,
  tradePrice: number,
) => {
  const { symbol } = positionState;
  if (activeListener.side === ListenerExitSide.TAKE_PROFIT) {
    const sellOrder = await handleTakeProfitActiveListener(symbol, activeListener, tradePrice);

    // if order placed, move this listener from active to inactive
    if (sellOrder) {
      await handleListenerOrderExecuted(positionState, activeListener, sellOrder);
    }
  }

  if (activeListener.side === ListenerExitSide.STOP) {
    const sellOrder = await handleStopLossActiveListener(symbol, activeListener, tradePrice);

    // if order placed, move this listener from active to inactive
    if (sellOrder) {
      await handleListenerOrderExecuted(positionState, activeListener, sellOrder);
    }
  }
};

const handleTakeProfitActiveListener = async (
  symbol: string,
  { triggerValue, closeOrder, order: existingOrderAlreadyPlacedForListener, timeRule, triggerType }: IListenerExitRule,
  tradePrice: number,
) => {
  if (existingOrderAlreadyPlacedForListener) {
    return;
  }

  if (triggerType === ListenerTriggerType.PRICE) {
    if (tradePrice >= triggerValue) {
      try {
        console.log('Take profit hit ', { symbol, tradePrice, triggerValue });
        const order = await alpacaClient.closePosition(closeOrder);
        console.log('Firing take profit order: ', JSON.stringify(closeOrder));
        return order;
      } catch (e) {
        console.error('Error firing take profit order', e);
      }
    }
  }
};

const handleStopLossActiveListener = async (
  symbol: string,
  { triggerValue, closeOrder, order: existingOrderAlreadyPlacedForListener, timeRule, triggerType }: IListenerExitRule,
  tradePrice: number,
) => {
  if (existingOrderAlreadyPlacedForListener) {
    return;
  }

  if (timeRule === ListenerTimeRule.DAILY_CLOSE) {
    const oneMinuteBeforeClose = isWithinOneMinuteOfMarketClose();
    if (!oneMinuteBeforeClose) {
      console.log('Not within one minute of close, skipping dynamic stop loss listener.');
      return;
    }
    console.log('Within one minute of close, moving forward with dynamic stop loss listener.');
  }

  if (triggerType === ListenerTriggerType.EMA) {
    const { ema } = await getTa('EMA', symbol, triggerValue);
    const todaysEma = ema[ema.length - 1];
    if (tradePrice < todaysEma) {
      try {
        console.log('Ema stop hit', { symbol, tradePrice, todaysEma });
        const order = await alpacaClient.closePosition(closeOrder);
        console.log('Firing dynamic stop order: ', JSON.stringify(closeOrder));
        return order;
      } catch (e) {
        console.error('Error firing dynamic stop order', e);
      }
    }
  } else if (triggerType === ListenerTriggerType.SMA) {
    const { sma } = await getTa('SMA', symbol, triggerValue);
    const todaysSma = sma[sma.length - 1];
    if (tradePrice < todaysSma) {
      try {
        console.log('Ema stop hit', { symbol, tradePrice, todaysSma });
        const order = await alpacaClient.closePosition(closeOrder);
        console.log('Firing dynamic stop order: ', JSON.stringify(closeOrder));
        return order;
      } catch (e) {
        console.error('Error firing dynamic stop order', e);
      }
    }
  } else if (triggerType === ListenerTriggerType.PRICE) {
    if (tradePrice <= triggerValue) {
      try {
        console.log('Stop hit ', { symbol, tradePrice, triggerValue });
        const order = await alpacaClient.closePosition(closeOrder);
        console.log('Firing stop loss close order: ', JSON.stringify(closeOrder));
        return order;
      } catch (e) {
        console.error('Error firing stop loss order', e);
      }
    }
  } else {
    return;
  }
};

const handleListenerOrderExecuted = async (
  positionState: IPosition,
  activeListener: IListenerExitRule,
  sellOrder: Order,
) => {
  // if order placed, move this listener from active to inactive
  const newActiveListeners = positionState.activeListeners.filter((listener) => listener !== activeListener);

  const newInactiveListenerState = {
    ...activeListener,
    order: sellOrder,
  };

  const newInactiveListeners = [...positionState.inactiveListeners, newInactiveListenerState];

  const newPositionState: IPosition = {
    ...positionState,
    activeListeners: newActiveListeners,
    inactiveListeners: newInactiveListeners,
  };

  await db.putAccountPosition(newPositionState);
  console.log({ newAccount: db.getAccount() });
};
