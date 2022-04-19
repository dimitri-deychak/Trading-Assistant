import { Activity, AlpacaStream, TradeActivity } from '@master-chief/alpaca';
import { latestPriceHandler } from './tradeListener/latestPriceHandlers';
import { accountTradeUpdatesHandler } from './accountListener/accountTradeHandlers';
import { ALPACA_API_KEYS, IS_DEV } from '../config';
import { db } from '../database';
import { alpacaClient } from '../alpacaClient';
import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
import { Account, PositionStatus } from '../../shared/interfaces';
import { Events } from '@master-chief/alpaca/@types/stream';
import { enqueue } from './queue';

export const syncAccountPositions = async () => {
  try {
    await removePositionsThatExistInDbButNotInServer();

    //   const queuedPositions = db.getAccountPositions().filter((position) => position.status === PositionStatus.QUEUED);
    //   for (const queuedPosition of queuedPositions) {
    //     // console.log({ queuedPosition: queuedPosition.entryRule.buyOrder });
    //     const entryOrder = await alpacaClient.getOrder({
    //       order_id: queuedPosition.entryRule.buyOrder.id,
    //     });
    //     // console.log({ entryOrder });
    //   }
    // const accountFillUpdates: Activity[] = await alpacaClient.getAccountActivities({ activity_type: 'FILL' });
    // for (const accountFillUpdate of accountFillUpdates as TradeActivity[]) {
    //   const order = await alpacaClient.getOrder({ order_id: accountFillUpdate.order_id });
    //   const tradeActivity = {
    //     ...accountFillUpdate,
    //     event: accountFillUpdate.type,
    //     order,
    //     execution_id: accountFillUpdate.id,
    //   } as TradeUpdate;
    //   await accountTradeUpdatesHandler(accountFillUpdate);
    // }
    // console.log({ accountFillUpdates });
  } catch (e) {
    console.log('error syncing account', e);
  }
};

const removePositionsThatExistInDbButNotInServer = async () => {
  if (!db.isInitialized()) {
    await db.init();
  }

  const dbPositions = db.getAccountPositions();
  const symbolsInDbPositions = dbPositions.map((position) => position.symbol);
  const serverPositions = await alpacaClient.getPositions();

  const newDbPositionSymbols = [];

  for (const serverPosition of serverPositions) {
    const { symbol } = serverPosition;

    if (symbolsInDbPositions.includes(symbol)) {
      newDbPositionSymbols.push(symbol);
    }
  }

  const newDbPositions = dbPositions.filter((position) => newDbPositionSymbols.includes(position.symbol));
  const newAccount = { ...db.getAccount(), positions: newDbPositions } as Account;
  await db.putAccount(newAccount);
};
