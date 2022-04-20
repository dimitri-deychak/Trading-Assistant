import { Activity, TradeActivity } from '@master-chief/alpaca';
import { accountTradeUpdatesHandler } from './accountListener/accountTradeHandlers';
import { db } from '../database';
import { alpacaClient } from '../alpacaClient';
import { Account, CustomTradeUpdate, PositionStatus } from '../../shared/interfaces';

export const syncAccountPositions = async () => {
  try {
    await removePositionsThatExistInDbButNotInServer();
  } catch (e) {
    console.error('Error removing positions that exist in db but not in server', e);
  }

  try {
    const dateWhenServerClosed = db.getProcessExitDate();
    const accountFillUpdates: Activity[] = await alpacaClient.getAccountActivities({
      activity_type: 'FILL',
      after: dateWhenServerClosed,
    });

    for (const accountFillUpdate of accountFillUpdates as TradeActivity[]) {
      try {
        console.log({ accountFillUpdate });
        const order = await alpacaClient.getOrder({ order_id: accountFillUpdate.order_id });
        if (!order) {
          throw new Error('No corresponding order on server for hydration');
        }
        const position = await alpacaClient.getPosition({ symbol: accountFillUpdate.symbol });
        if (!position) {
          throw new Error('No corresponding position on server for hydration');
        }
        const tradeActivity = {
          ...accountFillUpdate,
          event: accountFillUpdate.type,
          order,
          position_qty: position.qty,
          execution_id: accountFillUpdate.id,
        } as CustomTradeUpdate;
        await accountTradeUpdatesHandler(tradeActivity);
      } catch (e) {
        console.error('Error for specific account activity', e);
      }
    }
  } catch (e) {
    console.error('error syncing account', e);
  }
};

const removePositionsThatExistInDbButNotInServer = async () => {
  if (!db.isInitialized()) {
    await db.init();
  }

  console.log('Checking for stale positions...');

  const dbPositions = db.getAccountPositions();
  const serverPositions = await alpacaClient.getPositions();
  const orders = await alpacaClient.getOrders({ status: 'open' });

  const newDbPositions = [];

  for (const dbPosition of dbPositions) {
    const positionIsOpen = [PositionStatus.OPEN, PositionStatus.RUNNER].includes(dbPosition.status);

    if (positionIsOpen) {
      const positionExistsOnServer = serverPositions.find(
        (serverPosition) => serverPosition.symbol === dbPosition.symbol,
      );
      if (positionExistsOnServer) {
        newDbPositions.push(dbPosition);
      }
    }

    const positionIsQueued = [PositionStatus.QUEUED].includes(dbPosition.status);
    if (positionIsQueued) {
      const buyOrderExistsForPosition = orders.find(
        (order) => order.symbol === dbPosition.symbol && order.side === 'buy',
      );
      if (buyOrderExistsForPosition) {
        newDbPositions.push(dbPosition);
      }
    }
  }

  const newAccount = { ...db.getAccount(), positions: newDbPositions } as Account;
  await db.putAccount(newAccount);
};
