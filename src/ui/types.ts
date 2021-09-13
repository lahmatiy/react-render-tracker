import { TransferFiber, Message } from "common-types";
export * from "common-types";

export type Event = Message;

export interface MessageFiber extends TransferFiber {
  mounted: boolean;
  events: Event[];
  rerendersCount: number;
  selfTime: number;
  totalTime: number;
}

export interface FiberEvent {
  fiber: MessageFiber;
  event: Event;
}
