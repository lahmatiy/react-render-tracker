import {
  Message,
  TransferFiber,
  TransferFiberContext,
  TransferChangeDiff,
  TransferPropChange,
  TransferStateChange,
  TransferMemoChange,
  TransferHookInfo,
} from "common-types";
export * from "common-types";

export type LocType = "default" | "jsx";

export type SourceEvent = Message;
export type LinkedEvent = CommitEvent | FiberEvent;
export type SourceCommitEvent = Extract<SourceEvent, { op: "commit-start" }>;
export type SourceDefEvent = Extract<SourceEvent, { op: "fiber-type-def" }>;
export type SourceFiberEvent = Exclude<
  SourceEvent,
  SourceCommitEvent | SourceDefEvent
>;
export type FiberTypeHook = Omit<TransferHookInfo, "context"> & {
  index: number;
  context: TransferFiberContext | null;
};
export type FiberTypeDef = {
  contexts: TransferFiberContext[] | null;
  hooks: FiberTypeHook[];
};
export type FiberChanges = {
  props?: TransferPropChange[] | null;
  context: FiberContextChange[] | null;
  state?: FiberStateChange[] | null;
  memos?: TransferMemoChange[] | null;
  warnings: Set<TransferPropChange | FiberStateChange> | null;
};
export type FiberContextChange = {
  context: TransferFiberContext | null;
  prev?: string;
  next?: string;
  diff?: TransferChangeDiff;
};
export type FiberStateChange = Omit<TransferStateChange, "hook"> & {
  hook: FiberTypeHook | null;
};

export interface MessageFiber extends TransferFiber {
  displayName: string;
  typeDef: FiberTypeDef;
  mounted: boolean;
  events: FiberEvent[];
  updatesCount: number;
  updatesBailoutCount: number;
  updatesBailoutStateCount: number;
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
  event: SourceFiberEvent;
  changes: FiberChanges | null;
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
