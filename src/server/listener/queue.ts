import { db } from '../database';
import { fetchAccountActivities } from './accountListener/accountListener';
import { removePositionsThatExistInDbButNotInServer } from './syncTradesSinceLastUpdate';
const initialSetup = async () => {
  await db.init();
  await fetchAccountActivities();
  await removePositionsThatExistInDbButNotInServer();

  setInterval(() => {
    enqueue(async () => await fetchAccountActivities());
  }, 1000);
};

let currentPromise = initialSetup();
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) =>
  (currentPromise = currentPromise.then(promise));
