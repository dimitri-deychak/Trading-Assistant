import { ClosePosition, Order, PlaceOrder } from '@master-chief/alpaca';

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

export interface Account {
  positions: IPosition[];
  closedPositions: IPosition[];
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

export interface IListenerSimpleTargetExitRule {
  side: ListenerExitSide.TAKE_PROFIT;
  triggerPrice: number;
  closeOrder: ClosePosition;
  order?: Order;
  breakEvenOnRest?: boolean;
}

export interface IListenerSimpleStopLossRule {
  side: ListenerExitSide.STOP;
  triggerPrice: number;
  closeOrder: ClosePosition;
  order?: Order;
}

export type IListenerSimpleExitRule = IListenerSimpleTargetExitRule | IListenerSimpleStopLossRule;

export type IListenerExitRule = IListenerSimpleExitRule;

export interface IEntryRule {
  buyOrder: Order;
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
