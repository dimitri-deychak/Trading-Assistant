import { getCST } from '../../shared/utils';
import { clock } from './intervals';

export const isWithinOneMinuteOfMarketClose = () => {
  if (!clock) {
    return false;
  }

  const nextClose = clock.next_close;
  const oneMinuteBeforeClose = new Date(nextClose.getTime() - 1000 * 60);
  const now = new Date();
  const withinOneMinuteOfClose = now > oneMinuteBeforeClose && now < nextClose;
  console.log({
    nextClose: getCST(nextClose),
    oneMinuteBeforeClose: getCST(oneMinuteBeforeClose),
    now: getCST(now),
    withinOneMinuteOfClose,
  });
  if (!withinOneMinuteOfClose) {
    console.log('Not within one minute of close, skipping dynamic stop loss listener.');
    return;
  }
  console.log('Within one minute of close, moving forward with dynamic stop loss listener.');
};
