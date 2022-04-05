import { ClosePosition, Order, PlaceOrder } from '@master-chief/alpaca';

export interface IRawTradeEntry {
  newSymbol: string;
  entryPrice: number;
  stopPrice: number;
  deRiskTargetMultiple: number;
  riskInDollars: number;
}

export enum PositionStatus {
  QUEUED,
  OPEN,
  RUNNER
}

export enum ListenerExitSide {
  TAKE_PROFIT,
  STOP
}

export interface IListenerSimpleExitRule {
  side: ListenerExitSide;
  triggerPrice: number;
  closeOrder: ClosePosition;
  order?: Order;
}

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
}
