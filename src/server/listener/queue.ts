import { IS_DEV_ALPACA, USE_POLLING_INSTEAD_OF_STREAM } from '../config';
import { db } from '../database';
import { fetchAccountActivities } from './accountListener/accountListener';
import { setAccountInterval, setClockInterval, setPriceInterval } from './intervals';
import { removePositionsThatExistInDbButNotInServer } from './syncTradesSinceLastUpdate';

const initialSetup = async () => {
  await db.init();
  await fetchAccountActivities();
  await removePositionsThatExistInDbButNotInServer();

  setAccountInterval();
  setClockInterval();

  if (IS_DEV_ALPACA || USE_POLLING_INSTEAD_OF_STREAM) {
    setPriceInterval();
  }
};

let currentPromise = initialSetup();
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) => {
  currentPromise = currentPromise.then(promise).catch((e) => console.log('ERROR in promise queue', e));
};
