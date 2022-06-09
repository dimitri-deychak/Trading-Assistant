import { Activity, ClosePosition, TradeActivity } from '@master-chief/alpaca';
import {
  CustomTradeUpdate,
  IListenerExitRule,
  IListenerSimpleStopLossRule,
  IPosition,
  ListenerExitSide,
  ListenerQuantityType,
  ListenerTimeRule,
  ListenerTriggerType,
  PositionStatus,
} from '../../../shared/interfaces';
import { db } from '../../database';
import { updateTradePriceSubscriptionsToAccountPositions } from '../tradeListener/tradeListener';
import { alpacaClient } from '../../alpacaClient';

const isTradeActivity = (activity: Activity): activity is TradeActivity => {
  const isFillEvent = ['fill', 'partial_fill'].includes((activity as TradeActivity).type);
  return activity.symbol && (activity as TradeActivity).order_id && isFillEvent;
};

export const accountActivityHandler = async (activity: Activity) => {
  console.log('account activity handler', { activity });

  if (!isTradeActivity(activity)) {
    throw new Error('Not handling NonTradeActivity.');
  }

  const { symbol, order_id: orderId, type: activityType } = activity;
  const isFillEvent = ['fill', 'partial_fill'].includes(activityType);

  const positionState = db.getAccountPosition(symbol);
  if (!positionState) {
    throw new Error('Getting trade updates for untracked position - ' + symbol);
  }

  if (!orderId) {
    throw new Error('Missing Client Order Id in position - ' + symbol);
  }

  const isBuyOrder = orderId === positionState.entryRule.buyOrder.id;
  if (isBuyOrder) {
    await handleBuyOrderFilled(positionState, activity);
    return;
  }

  const sellOrder = positionState.inactiveListeners.find((inactiveListener) => inactiveListener.order?.id === orderId);
  if (sellOrder) {
    await handleSellOrderFilled(positionState, activity);
    return;
  }

  if (isFillEvent) {
    console.log(JSON.stringify({ debug: { activity, positionState, sellOrder } }));
    throw new Error('Matching saved sell order not found for fill event ^ - ' + symbol);
  }
};

const handleBuyOrderFilled = async (positionState: IPosition, activity: TradeActivity) => {
  // move buy order triggers to activeListeners
  const { symbol, order_id, cum_qty: positionQty } = activity;
  const {
    entryRule: { listenersToActivate, ...entryRule },
    activeListeners,
  } = positionState;

  try {
    entryRule.order = await alpacaClient.getOrder({ order_id });
  } catch (e) {
    console.log('Failed to retrieve filled listener order', e);
  }

  try {
    const serverPosition = await alpacaClient.getPosition({ symbol });
    positionState.positionQty = serverPosition.qty;
  } catch (e) {
    positionState.positionQty = 0;
  }

  const newEntryRule = {
    ...entryRule,
    listenersToActivate: [] as IListenerExitRule[],
  };

  const newActiveListeners = [...activeListeners, ...(listenersToActivate || [])];

  const newPositionState: IPosition = {
    ...positionState,
    activeListeners: newActiveListeners,
    status: PositionStatus.OPEN,
    entryRule: newEntryRule,
    positionQty,
  };

  await db.putAccountPosition(newPositionState);
  console.log({ newAccount: db.getAccount() });
  updateTradePriceSubscriptionsToAccountPositions();
};

const handleSellOrderFilled = async (positionState: IPosition, activity: TradeActivity) => {
  const { type } = activity;
  const isFill = ['partial_fill', 'fill'].includes(type);
  if (isFill) {
    await handleSellOrderFill(positionState, activity);
  } else {
    const { symbol } = positionState;
    console.error(`Untracked sell event type ${type} occurring for ${symbol}`);
  }
};

const handleSellOrderFill = async (positionState: IPosition, activity: TradeActivity) => {
  const { inactiveListeners } = positionState;
  const { symbol, order_id } = activity;

  const filledListener = inactiveListeners.find((inactiveListener) => inactiveListener?.order?.id === order_id);
  if (!filledListener) {
    throw new Error(
      `Sell fill occurred without a matching order in activeListeners for ${symbol}. Order id ${order_id}`,
    );
  }

  // Keep in place attribute update
  try {
    filledListener.order = await alpacaClient.getOrder({ order_id });
  } catch (e) {
    console.log('Failed to retrieve filled listener order', e);
  }

  try {
    const serverPosition = await alpacaClient.getPosition({ symbol });
    positionState.positionQty = serverPosition.qty;
  } catch (e) {
    positionState.positionQty = 0;
  }
  // Update db with order state
  await db.putAccountPosition(positionState);
  console.log({ newAccount: db.getAccount() });

  if (positionState.positionQty > 0) {
    const shouldBreakEvenOnRest =
      filledListener.side === ListenerExitSide.TAKE_PROFIT && filledListener.breakEvenOnRest;
    if (shouldBreakEvenOnRest) {
      await handleBreakEvenOnRest(positionState);
    }
  } else {
    positionState.inactiveListeners = [...positionState.inactiveListeners, ...positionState.activeListeners];
    positionState.activeListeners = [];
    positionState.status = PositionStatus.CLOSED;
    // move position to closed position
    const { positions, closedPositions, ...account } = db.getAccount();
    const newPositions = positions.filter((position) => position.symbol !== symbol);
    const newClosedPositions = [...closedPositions, positionState];
    const newAccount = { ...account, positions: newPositions, closedPositions: newClosedPositions };
    await db.putAccount(newAccount);
    console.log({ newAccount: db.getAccount() });
  }
};

// ToDo: This will need to be updated if we allow for multiple entry rules
const handleBreakEvenOnRest = async (positionState: IPosition) => {
  const {
    symbol,
    activeListeners,
    inactiveListeners,
    entryRule: {
      order: { filled_avg_price: avgEntryPrice },
    },
    positionQty,
  } = positionState;

  if (!avgEntryPrice) {
    throw new Error(`Trying to set stops to break even on ${symbol} but does not have an average fill price available`);
  }

  const breakEvenCounters = {
    proceedsSoFar: 0,
    costBasisSoFar: 0,
  };

  inactiveListeners.forEach((inactiveListener) => {
    const { order } = inactiveListener;

    if (inactiveListener.side === ListenerExitSide.TAKE_PROFIT && order) {
      const { filled_avg_price: filledAvgPrice, filled_qty: filledQty } = order;

      const costBasisForListener = avgEntryPrice * filledQty;
      breakEvenCounters.costBasisSoFar += costBasisForListener;

      const proceedsForListener = filledAvgPrice * filledQty;
      breakEvenCounters.proceedsSoFar += proceedsForListener;
    }
  });

  const { proceedsSoFar, costBasisSoFar } = breakEvenCounters;

  const profitSoFar = Math.max(0, proceedsSoFar - costBasisSoFar);

  if (profitSoFar === 0) {
    throw new Error(`Trying to set stops to break even on ${symbol} but does not have any profit yet.`);
  }

  const a = positionQty * avgEntryPrice;
  const y = positionQty;
  const newStopPrice = (-profitSoFar + a) / y;
  const twoCentsAboveNewStopPrice = Number((newStopPrice + 0.02).toFixed(2));

  const newStopLossClosePositionOrder: ClosePosition = {
    symbol,
    percentage: 100,
  };

  const newStopLossActiveListener: IListenerSimpleStopLossRule = {
    triggerType: ListenerTriggerType.PRICE,
    side: ListenerExitSide.STOP,
    timeRule: ListenerTimeRule.AS_SOON_AS_TRIGGER_OCCURS,
    triggerValue: twoCentsAboveNewStopPrice,
    closeOrder: newStopLossClosePositionOrder,
  };

  const stopLossActiveListeners = activeListeners.filter(
    (activeListener) => activeListener.side === ListenerExitSide.STOP,
  );
  const nonStopLossActiveListeners = activeListeners.filter(
    (activeListener) => activeListener.side !== ListenerExitSide.STOP,
  );

  const newInactiveListeners = [...inactiveListeners, ...stopLossActiveListeners];
  const newActiveListeners = [...nonStopLossActiveListeners, newStopLossActiveListener];

  const newPositionState: IPosition = {
    ...positionState,
    activeListeners: newActiveListeners,
    inactiveListeners: newInactiveListeners,
    status: PositionStatus.RUNNER,
  };

  await db.putAccountPosition(newPositionState);
  console.log({ newAccount: db.getAccount() });
};
