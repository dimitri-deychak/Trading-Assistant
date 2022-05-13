import { ClosePosition, Order, PlaceOrder, TradeActivity } from '@master-chief/alpaca';

// 3 Tiers of positions
// runners are trades that have some profit taken and stop moved to break even, so essentially risk free
// open are trades that are active but still carry some risk
// queued are trades that have not yet had their buy orders triggered
export enum PositionStatus {
  QUEUED,
  OPEN,
  RUNNER,
  CLOSED,
}

export interface CustomTradeUpdate extends TradeActivity {
  order: Order;
  position_qty: number;
  event: 'fill' | 'partial_fill';
}

export interface Account {
  positions: IPosition[];
  closedPositions: IPosition[];
  lastTradeUpdateDate: string;
}

export interface IRawTradeEntry {
  newSymbol: string;
  entryPrice: number;
  stopPrice: number;
  deRiskTargetMultiple: number;
  riskInDollars: number;
}

export enum ListenerExitSide {
  TAKE_PROFIT,
  STOP,
}

export const ListenerSideDisplayMap = {
  'Stop loss': ListenerExitSide.STOP,
  'Take profit': ListenerExitSide.TAKE_PROFIT,
};

export enum ListenerTriggerType {
  PRICE,
  SMA,
  EMA,
}

export const ListenerTriggerTypeDisplayMap = {
  [ListenerTriggerType.PRICE]: 'Price',
  [ListenerTriggerType.SMA]: 'Simple Moving Avg (Daily)',
  [ListenerTriggerType.EMA]: 'Exp Moving Avg (Daily)',
};

export enum ListenerTimeRule {
  AS_SOON_AS_TRIGGER_OCCURS,
  DAILY_CLOSE,
}

export const ListenerTimeRuleDisplayMap = {
  [ListenerTimeRule.AS_SOON_AS_TRIGGER_OCCURS]: 'As soon as trigger event occurs',
  [ListenerTimeRule.DAILY_CLOSE]: 'On daily close',
};

export enum ListenerQuantityType {
  PERCENTAGE,
  QUANTITY,
}

export const ListenerQuantityTypeDisplayMap = {
  [ListenerQuantityType.PERCENTAGE]: 'Percent of open position',
  [ListenerQuantityType.QUANTITY]: 'Number of shares',
};

export interface IListenerSimpleTargetExitRule extends IListenerExitRuleBase {
  side: ListenerExitSide.TAKE_PROFIT;
  breakEvenOnRest?: boolean;
}

export interface IListenerSimpleStopLossRule extends IListenerExitRuleBase {
  side: ListenerExitSide.STOP;
}

export type IListenerExitRule = IListenerSimpleTargetExitRule | IListenerSimpleStopLossRule;

export type IListenerExitRuleBase = {
  triggerType: ListenerTriggerType;
  timeRule: ListenerTimeRule;
  triggerValue: number;
  closeOrder: ClosePosition;
  order?: Order;
};

export interface IEntryRule {
  buyOrder: Order;
  order?: Order;
  listenersToActivate: IListenerExitRule[];
}

export interface IPosition {
  status: PositionStatus;
  symbol: string;
  entryRule: IEntryRule;
  activeListeners: IListenerExitRule[];
  inactiveListeners: IListenerExitRule[];
  positionQty: number;
}

export interface IEnv {
  API_KEY_ID: string;
  SECRET_KEY: string;
  IS_DEV: boolean;
  // PAPER_API_KEY_ID: string;
  // PAPER_SECRET_KEY: string;
}
