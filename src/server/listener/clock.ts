import { clock } from './intervals';

export const isWithinOneMinuteOfMarketClose = () => {
  if (!clock) {
    return false;
  }

  const nextClose = clock.next_close;
  const oneMinuteBeforeClose = new Date(nextClose.getTime() - 1000 * 60);
  const now = new Date();
  const withinOneMinuteOfClose = now > oneMinuteBeforeClose && now < nextClose;
  return withinOneMinuteOfClose;
};
