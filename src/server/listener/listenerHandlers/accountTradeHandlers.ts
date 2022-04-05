import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
import { db } from '../../database';
import { IListenerExitRule, IPosition } from '../../../shared/interfaces';

export const accountTradeUpdatesHandler = (tradeUpdate: TradeUpdate) => {
  const { order, event } = tradeUpdate;
  const { symbol } = order;
  const positionState = db.get(symbol);
  if (!positionState) {
    throw new Error('Getting trade updates for untracked position - ' + symbol);
  }

  const orderFillEvent = ['fill', 'partial_fill'].includes(event);
  if (orderFillEvent) {
    handleBuyOrderFilled(positionState);
  }
};

const handleBuyOrderFilled = (positionState: IPosition) => {
  // move buy order triggers to activeListeners
  const {
    entryRule: { listenersToActivate, ...entryRule }
  } = positionState;

  if (listenersToActivate.length > 0) {
    const newEntryRule = {
      ...entryRule,
      listenersToActivate: [] as IListenerExitRule[]
    };

    const newPositionState = {
      ...positionState
    };
  }
};
