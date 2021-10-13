import { TransferFiber, Message } from "common-types";
export * from "common-types";

export type SourceEvent = Message;
export type LinkedEvent = CommitEvent | FiberEvent;
export type SourceCommitEvent = Extract<SourceEvent, { op: "commit-start" }>;
export type SourceFiberEvent = Exclude<SourceEvent, SourceCommitEvent>;

export interface MessageFiber extends TransferFiber {
  mounted: boolean;
  events: LinkedEvent[];
  updatesCount: number;
  bailoutUpdatesCount: number;
  selfTime: number;
  totalTime: number;
  warnings: number;
}

export interface CommitEvent {
  target: "commit";
  targetId: number;
  event: Extract<SourceEvent, { op: "commit-start" }>;
  trigger: null;
}

export interface FiberEvent {
  target: "fiber";
  targetId: number;
  event: SourceEvent;
  trigger: LinkedEvent | null;
  triggeredByOwner: boolean;
}

export interface ValueTransition {
  prev?: any;
  next?: any;
}

export interface Commit {
  start: CommitEvent;
  finish: LinkedEvent | null;
}
