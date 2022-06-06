import { Activity } from '@master-chief/alpaca/@types/entities';
import { alpacaClient } from '../../alpacaClient';
import { db } from '../../database';
import { enqueue } from '../queue';
import { accountActivityHandler } from './accountTradeHandlers';

const SIXTY_SECONDS_IN_MS = 1000 * 60;
const SIXTY_MINUTES_IN_MS = SIXTY_SECONDS_IN_MS * 60;
const ONE_DAY_IN_MS = 24 * SIXTY_MINUTES_IN_MS;

export const fetchAccountActivities = async () => {
  const lastTradeUpdateDate = new Date(db.getLastTradeUpdateDate());
  const aMinuteLessFromLastTradeUpdate = new Date(lastTradeUpdateDate.getTime() - ONE_DAY_IN_MS);
  console.log('Fetching acct activities after ', getCST(aMinuteLessFromLastTradeUpdate));

  await db.saveLastTradeUpdateDate();
  const accountActivities: Activity[] = await alpacaClient.getAccountActivities({
    activity_type: 'FILL',
    after: aMinuteLessFromLastTradeUpdate.toISOString(),
    direction: 'asc',
  });

  for (const accountActivity of accountActivities) {
    try {
      await processAccountActivity(accountActivity);
    } catch (e) {
      console.log('processAccountActivity error', e);
    }
  }
};

const processAccountActivity = async (activity: Activity) => {
  const accountActivityRecord = db.getAccountActivityRecord();
  const recordExistsForActivity = accountActivityRecord[activity.id];
  const activityNeedsProcessing = !recordExistsForActivity;

  if (activityNeedsProcessing) {
    try {
      await accountActivityHandler(activity);
    } catch (e) {
      console.log('accountActivityHandler error', e);
    }
    await db.setAccountActivityRecord(activity);
  }
};

const getCST = (date: Date) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const d = new Date(+date);

  // CST is UTC -0600 so subtract 6 hours and use UTC values
  let offset = 6;
  if (isDST(new Date())) {
    offset = 5;
  }
  d.setUTCHours(d.getUTCHours() - offset);

  return (
    months[d.getUTCMonth()] +
    ' ' +
    d.getUTCDate() +
    ', ' +
    d.getUTCFullYear() +
    ' ' +
    (d.getUTCHours() % 12 || 12) +
    ':' +
    ('0' + d.getUTCMinutes()).slice(-2) +
    ':' +
    d.getUTCSeconds() +
    ' ' +
    (d.getUTCHours() < 12 ? 'AM' : 'PM') +
    ' Central Time'
  );
};

const isDST = (d: Date) => {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== d.getTimezoneOffset();
};
