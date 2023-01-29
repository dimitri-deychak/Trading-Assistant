import { Activity, TradeActivity } from '@master-chief/alpaca';
import { db } from '../database';
import { alpacaClient } from '../alpacaClient';
import { Account, CustomTradeUpdate, PositionStatus } from '../../shared/interfaces';

// enum BACKFILL_ERRORS {
//   GET_ORDER_ERROR = 'GET_ORDER_ERROR',
//   GET_POSITION_ERROR = 'GET_POSITION_ERROR',
// }

// export const syncAccountPositions = async () => {
//   try {
//     const dateOfLastUpdate = db.getLastTradeUpdateDate();
//     if (!dateOfLastUpdate) {
//       console.log('No date of last trade update, can not sync');
//       return 0;
//     }
//     console.log('TIME NOW: ', new Date().toISOString());
//     console.log('BEGINNING BACKFILL FOR WHEN SERVER WAS OFFLINE GOING BACK TO: ', dateOfLastUpdate);

//     const accountFillUpdates: Activity[] = await alpacaClient.getAccountActivities({
//       activity_type: 'FILL',
//       after: dateOfLastUpdate,
//     });
//     await db.saveLastTradeUpdateDate(); // going to re run this until no more updates

//     console.log(accountFillUpdates.length + ' number of orders to process since last update');

//     for (const accountFillUpdate of accountFillUpdates as TradeActivity[]) {
//       try {
//         console.log({ accountFillUpdate });
//         let order;
//         let position;

//         try {
//           order = await alpacaClient.getOrder({ order_id: accountFillUpdate.order_id });
//         } catch (e) {
//           throw BACKFILL_ERRORS.GET_ORDER_ERROR;
//         }

//         try {
//           position = await alpacaClient.getPosition({ symbol: accountFillUpdate.symbol });
//         } catch (e) {
//           throw BACKFILL_ERRORS.GET_POSITION_ERROR;
//         }

//         const tradeActivity = {
//           ...accountFillUpdate,
//           event: accountFillUpdate.type,
//           order,
//           position_qty: position.qty,
//           execution_id: accountFillUpdate.id,
//         } as CustomTradeUpdate;
//         await accountTradeUpdatesHandler(tradeActivity);
//       } catch (e) {
//         if (e === BACKFILL_ERRORS.GET_ORDER_ERROR || e === BACKFILL_ERRORS.GET_POSITION_ERROR) {
//           console.log('known backfill error, ', e, accountFillUpdate);
//         } else {
//           console.log('unknown error processing backfills', e);
//         }
//       }
//     }
//     return accountFillUpdates.length;
//   } catch (e) {
//     console.error('error syncing account', e);
//   }
// };

export const removePositionsThatExistInDbButNotInServer = async () => {
  const clock = await alpacaClient.getClock();
  console.log({ clock: clock.next_close });
  console.log('Checking for stale positions...');

  const dbPositions = db.getAccountPositions();
  const serverPositions = await alpacaClient.getPositions();
  console.log({ serverPositions });
  const orders = await alpacaClient.getOrders({ status: 'open' });
  console.log({ orders });

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
