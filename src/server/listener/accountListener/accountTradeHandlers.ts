import { ClosePosition } from '@master-chief/alpaca';
import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
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

export const accountTradeUpdatesHandler = async (tradeUpdate: TradeUpdate | CustomTradeUpdate) => {
  const { order, event } = tradeUpdate;
  const { symbol, client_order_id: clientOrderId } = order;
  const positionState = db.getAccountPosition(symbol);
  if (!positionState) {
    throw new Error('Getting trade updates for untracked position - ' + symbol);
  }

  if (!clientOrderId) {
    throw new Error('Missing Client Order Id in position - ' + symbol);
  }

  const isBuyOrder = clientOrderId === positionState.entryRule.buyOrder.client_order_id;
  const orderFillEvent = ['fill', 'partial_fill'].includes(event);
  if (isBuyOrder && orderFillEvent) {
    await handleBuyOrderFilled(positionState, tradeUpdate);
    return;
  }

  const sellOrder = positionState.inactiveListeners.find(
    (inactiveListener) => inactiveListener.order?.client_order_id === clientOrderId,
  );

  if (sellOrder && orderFillEvent) {
    await handleSellOrderFilled(positionState, tradeUpdate);
  } else {
    if (orderFillEvent) {
      console.log(JSON.stringify({ debug: { tradeUpdate, positionState, sellOrder } }));
      throw new Error('Matching saved sell order not found for fill event ^ - ' + symbol);
    }
  }
};

const handleBuyOrderFilled = async (positionState: IPosition, tradeUpdate: TradeUpdate | CustomTradeUpdate) => {
  // move buy order triggers to activeListeners
  const { order, position_qty: positionQty } = tradeUpdate;
  const {
    entryRule: { listenersToActivate, ...entryRule },
  } = positionState;

  const newEntryRule = {
    ...entryRule,
    listenersToActivate: [] as IListenerExitRule[],
    order,
  };

  const newPositionState: IPosition = {
    ...positionState,
    activeListeners: listenersToActivate,
    status: PositionStatus.OPEN,
    entryRule: newEntryRule,
    positionQty,
  };

  await db.putAccountPosition(newPositionState);
  updateTradePriceSubscriptionsToAccountPositions();
};

const handleSellOrderFilled = async (positionState: IPosition, tradeUpdate: TradeUpdate | CustomTradeUpdate) => {
  const { event } = tradeUpdate;
  if (event === 'partial_fill') {
    // Do we actually need to worry about this, since they will be market orders?
    // await handlePartialSellOrderFill(positionState, tradeUpdate);
  } else if (event === 'fill') {
    await handleSellOrderFill(positionState, tradeUpdate);
  } else {
    const { symbol } = positionState;
    console.error(`Untracked sell event ${event} occurring for ${symbol}`);
  }
};

const handleSellOrderFill = async (positionState: IPosition, tradeUpdate: TradeUpdate | CustomTradeUpdate) => {
  const { inactiveListeners, symbol } = positionState;
  const { order, position_qty: positionQty } = tradeUpdate;
  const { client_order_id: savedClientOrderId } = order;

  let filledListener = inactiveListeners.find(
    (inactiveListener) => inactiveListener?.order?.client_order_id === savedClientOrderId,
  );
  if (!filledListener) {
    throw new Error(
      `Sell fill occurred without a matching order in activeListeners for ${symbol}. Order id ${savedClientOrderId}`,
    );
  }

  // Keep in place attribute update
  filledListener.order = order;
  // Update db with order state
  await db.putAccountPosition(positionState);

  if (positionQty > 0) {
    const shouldBreakEvenOnRest =
      filledListener.side === ListenerExitSide.TAKE_PROFIT && filledListener.breakEvenOnRest;
    if (shouldBreakEvenOnRest) {
      await handleBreakEvenOnRest(positionState);
    }
  } else {
    // move position to closed position
    const { positions, closedPositions, ...account } = db.getAccount();
    const newPositions = positions.filter((position) => position.symbol !== symbol);
    const newClosedPositions = [...closedPositions, positionState];
    const newAccount = { ...account, positions: newPositions, closedPositions: newClosedPositions };
    await db.putAccount(newAccount);
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

  console.log({ breakEvenCounters });

  const profitSoFar = Math.max(0, proceedsSoFar - costBasisSoFar);

  console.log({ profitSoFar });

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
};
