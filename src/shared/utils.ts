import { ListenerExitSide, ListenerTriggerType, ListenerTimeRule, IListenerSimpleStopLossRule } from './interfaces';

export const formatNumber = (num: number | string, integer?: boolean) => {
  const toFixedValue = integer ? 0 : 2;
  return typeof num === 'number' ? Number(num.toFixed(toFixedValue)) : Number(parseFloat(num).toFixed(toFixedValue));
};

export const debounce = (func: Function, timeout: number = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

export const getDefaultStopLossListener = (symbol: string) => {
  return {
    side: ListenerExitSide.STOP,
    triggerType: ListenerTriggerType.PRICE,
    timeRule: ListenerTimeRule.AS_SOON_AS_TRIGGER_OCCURS,
    triggerValue: 1,
    closeOrder: { symbol, percentage: 100 },
  } as IListenerSimpleStopLossRule;
};

export const convertDecimalToPercentage = (input: number) => {
  return input * 100;
};

export const findCommonElements = (arr1: string[], arr2: string[]) => {
  return arr1.some((item) => arr2.includes(item));
};

export const getCST = (date: Date) => {
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
