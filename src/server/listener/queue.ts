import { IS_DEV_ALPACA } from '../config';
import { db } from '../database';
import { fetchAccountActivities } from './accountListener/accountListener';
import { setAccountInterval, setPriceInterval } from './intervals';
import { removePositionsThatExistInDbButNotInServer } from './syncTradesSinceLastUpdate';
import { initiateTradeStream } from './tradeListener/tradeListener';

const initialSetup = async () => {
  await db.init();
  await fetchAccountActivities();
  await removePositionsThatExistInDbButNotInServer();

  setAccountInterval();

  if (IS_DEV_ALPACA) {
    setPriceInterval();
  } else {
    initiateTradeStream();
  }
};

let currentPromise = initialSetup();
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) => {
  currentPromise = currentPromise.then(promise).catch((e) => console.log('ERROR in promise queue', e));
};
