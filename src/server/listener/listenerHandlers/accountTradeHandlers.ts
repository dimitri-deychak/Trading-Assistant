import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
import { IListenerExitRule, IPosition } from '../../../shared/interfaces';
import { getPositionStateFromS3, updatePositionInS3 } from '../../database';

export const accountTradeUpdatesHandler = async (tradeUpdate: TradeUpdate) => {
  const { order, event } = tradeUpdate;
  const { symbol } = order;
  const positionState = await getPositionStateFromS3(symbol);
  if (!positionState) {
    throw new Error('Getting trade updates for untracked position - ' + symbol);
  }

  const orderFillEvent = ['fill', 'partial_fill'].includes(event);
  if (orderFillEvent) {
    await handleBuyOrderFilled(positionState);
  }
};

const handleBuyOrderFilled = async (positionState: IPosition) => {
  // move buy order triggers to activeListeners
  const {
    entryRule: { listenersToActivate, ...entryRule },
  } = positionState;

  const newEntryRule = {
    ...entryRule,
    listenersToActivate: [] as IListenerExitRule[],
  };

  const newPositionState = {
    ...positionState,
    entryRule: newEntryRule,
  };

  await updatePositionInS3(newPositionState);
};
