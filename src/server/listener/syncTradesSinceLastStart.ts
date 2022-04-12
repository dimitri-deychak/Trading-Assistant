import { Activity, AlpacaStream, TradeActivity } from '@master-chief/alpaca';
import { latestPriceHandler } from './tradeListener/latestPriceHandlers';
import { accountTradeUpdatesHandler } from './accountListener/accountTradeHandlers';
import { ALPACA_API_KEYS, IS_DEV } from '../config';
import { db } from '../database';
import { alpacaClient } from '../alpacaClient';
import { TradeUpdate } from '@master-chief/alpaca/@types/entities';
import { PositionStatus } from '../../shared/interfaces';
import { Events } from '@master-chief/alpaca/@types/stream';

const syncAccountPositions = async () => {
  try {
    const queuedPositions = db.getAccountPositions().filter((position) => position.status === PositionStatus.QUEUED);
    for (const queuedPosition of queuedPositions) {
      // console.log({ queuedPosition: queuedPosition.entryRule.buyOrder });

      const entryOrder = await alpacaClient.getOrder({
        order_id: queuedPosition.entryRule.buyOrder.id,
      });
      // console.log({ entryOrder });
    }
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
