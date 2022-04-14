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
