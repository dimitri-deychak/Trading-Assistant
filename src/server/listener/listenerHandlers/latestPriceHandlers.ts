import { Trade, Order } from '@master-chief/alpaca';
import { IPosition, IListenerExitRule, ListenerExitSide } from '../../../shared/interfaces';
import { alpacaClient } from '../../alpacaClient';
import { getPositionStateFromS3, updatePositionInS3 } from '../../database';
import { tradeStream } from '../listener';

export const latestPriceHandler = async (trade: Trade) => {
  const { p: tradePrice, S: symbol } = trade;
  const positionState = await getPositionStateFromS3(symbol);

  if (!positionState) {
    if (symbol) {
      tradeStream.unsubscribe('trades', [symbol]);
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
};

const processActiveListener = async (
  positionState: IPosition,
  activeListener: IListenerExitRule,
  tradePrice: number,
) => {
  if (activeListener.side === ListenerExitSide.TAKE_PROFIT) {
    const sellOrder = await handleTakeProfitActiveListener(activeListener, tradePrice);

    // if order placed, move this listener from active to inactive
    if (sellOrder) {
      await handleListenerOrderExecuted(positionState, activeListener, sellOrder);
    }
  }

  if (activeListener.side === ListenerExitSide.STOP) {
    const sellOrder = await handleStopLossActiveListener(activeListener, tradePrice);

    // if order placed, move this listener from active to inactive
    if (sellOrder) {
      await handleListenerOrderExecuted(positionState, activeListener, sellOrder);
    }
  }
};

const handleTakeProfitActiveListener = async (
  { triggerPrice, order: closeOrder }: IListenerExitRule,
  tradePrice: number,
) => {
  if (tradePrice >= triggerPrice) {
    try {
      const order = await alpacaClient.closePosition(closeOrder);
      return order;
    } catch (e) {
      console.error(e);
    }
  }
};

const handleStopLossActiveListener = async (
  { triggerPrice, order: closeOrder }: IListenerExitRule,
  tradePrice: number,
) => {
  if (tradePrice <= triggerPrice) {
    try {
      const order = await alpacaClient.closePosition(closeOrder);
      return order;
    } catch (e) {
      console.error(e);
    }
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

  await updatePositionInS3(newPositionState);
};
