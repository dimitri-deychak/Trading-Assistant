import { IListenerExitRule } from '../../shared/interfaces';

export const moveActiveListenersToInactive = (
  activeListeners: IListenerExitRule[],
  inactiveListeners: IListenerExitRule[],
  orderIdsToDeactivate: string[],
) => {
  const listenersToDeactivate = activeListeners.filter((activeListener) =>
    orderIdsToDeactivate.includes(activeListener?.order.client_order_id),
  );
  const newActiveListeners = activeListeners.filter(
    (activeListener) => !listenersToDeactivate.includes(activeListener),
  );

  const newInactiveListeners = [...inactiveListeners, ...listenersToDeactivate];

  return { newActiveListeners, newInactiveListeners };
};
