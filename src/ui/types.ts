import {
  TransferFiber,
  MountElementMessage,
  UnmountElementMessage,
  UpdateElementMessage,
} from "common-types";
export * from "common-types";

export type Event =
  | MountElementMessage
  | UnmountElementMessage
  | UpdateElementMessage;

export interface MessageFiber extends TransferFiber {
  mounted: boolean;
  events: Event[];
  rerendersCount: number;
  selfTime: number;
  totalTime: number;
}

export interface ElementEvent {
  component: MessageFiber;
  event: Event;
}
