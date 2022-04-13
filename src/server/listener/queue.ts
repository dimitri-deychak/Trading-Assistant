let currentPromise = Promise.resolve();
export const enqueue = (promise: (value: void) => void | PromiseLike<void>) =>
  (currentPromise = currentPromise.then(promise));
