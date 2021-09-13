import {
  TransferElement,
  MountElementMessage,
  UnmountElementMessage,
  UpdateElementMessage,
} from "common-types";
export * from "common-types";

export type Event =
  | MountElementMessage
  | UnmountElementMessage
  | UpdateElementMessage;

export interface MessageElement extends TransferElement {
  mounted: boolean;
  events: Event[];
  rerendersCount: number;
  selfTime: number;
  totalTime: number;
}

export interface ElementEvent {
  component: MessageElement;
  event: Event;
}
