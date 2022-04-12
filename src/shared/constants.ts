import {
  IListenerSimpleStopLossRule,
  IPosition,
  ListenerExitSide,
  ListenerQuantityType,
  ListenerTimeRule,
  ListenerTriggerType,
} from './interfaces';

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
