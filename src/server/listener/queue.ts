import { syncAccountPositions } from './syncTradesSinceLastStart';

const initialSetup = async () => {
  await syncAccountPositions();
};

let currentPromise = initialSetup();
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) =>
  (currentPromise = currentPromise.then(promise));
