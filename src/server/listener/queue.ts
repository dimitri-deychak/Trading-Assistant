import { removePositionsThatExistInDbButNotInServer, syncAccountPositions } from './syncTradesSinceLastUpdate';

const initialSetup = async () => {
  let numOrderUpdates = await syncAccountPositions();
  while (numOrderUpdates > 0) {
    numOrderUpdates = await syncAccountPositions();
  }
};

let currentPromise = initialSetup().then(removePositionsThatExistInDbButNotInServer);
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) =>
  (currentPromise = currentPromise.then(promise));
