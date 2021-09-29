import { TransferFiber, Message } from "common-types";
export * from "common-types";

export type Event = Message;

export interface MessageFiber extends TransferFiber {
  mounted: boolean;
  events: FiberEvent[];
  updatesCount: number;
  selfTime: number;
  totalTime: number;
  warnings: number;
}

export interface FiberEvent {
  fiberId: number;
  event: Event;
  trigger: FiberEvent | null;
  triggeredByOwner: boolean;
}

export interface ValueTransition {
  prev?: any;
  next?: any;
}
