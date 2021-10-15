declare module "common-types" {
  export type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  export type TransferFiberContext = {
    name: string;
    providerId?: number;
    reads?: Array<{
      index: number;
      trace: TransferCallTrace;
    }>;
  };

  export type TransferFiber = {
    id: number;
    type: FiberType;
    typeId: number;
    key: number | string | null;
    ownerId: number; // Owner (if available)
    parentId: number;
    displayName: string | null;
    hocDisplayNames: string[] | null;
    contexts: TransferFiberContext[] | null;
  };

  export type TransferCallTracePoint = {
    name: string;
    loc: string | null;
  };
  export type TransferCallTrace = {
    path: TransferCallTracePoint[] | undefined;
    loc: string | null;
  };

  export type TransferValueDiff = {
    name: string;
    prev?: string;
    next?: string;
  };
  export type TransferObjectDiff = {
    keys: number;
    diffKeys: number;
    sample: TransferValueDiff[];
  };
  export type TransferArrayDiff = {
    prevLength: number;
    nextLength: number;
    eqLeft: number;
    eqRight: number;
  };
  export type TransferChangeDiff =
    | TransferObjectDiff
    | TransferArrayDiff
    | false;
  export type TransferNamedEntryChange = {
    index?: number;
    name: string;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
    trace?: TransferCallTrace;
    calls?: null | Array<{ name: string; loc: null | string }>;
  };
  export type TransferContextChange = {
    name: string;
    providerId?: number;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
  };
  export type TransferFiberChanges = {
    props?: TransferNamedEntryChange[];
    context?: TransferContextChange[];
    state?: TransferNamedEntryChange[];
  };
  export type CommitTrigger = {
    type: "initial-mount" | "event" | "effect" | "unknown";
    fiberId: number;
    relatedFiberId?: number;
    event?: string;
    stack?: string;
  };

  export interface BaseMessage {
    op: string;
    id: number;
    timestamp: number;
  }

  export interface CommitStart extends BaseMessage {
    op: "commit-start";
    commitId: number;
    triggers: CommitTrigger[];
  }

  export interface MountFiberMessage extends BaseMessage {
    op: "mount";
    commitId: number;
    fiberId: number;
    fiber: TransferFiber;
    totalTime: number;
    selfTime: number;
    trigger?: number;
  }

  export interface UpdateFiberMessage extends BaseMessage {
    op: "update";
    commitId: number;
    fiberId: number;
    totalTime: number;
    selfTime: number;
    changes: TransferFiberChanges | null;
    trigger?: number;
  }

  export interface BailoutUpdateFiberMessage extends BaseMessage {
    op: "update-bailout";
    commitId: number;
    fiberId: number;
    trigger?: number;
  }

  export interface UnmountFiberMessage extends BaseMessage {
    op: "unmount";
    commitId: number;
    fiberId: number;
    trigger?: number;
  }

  export interface CreateEffectFiberMessage extends BaseMessage {
    op: "effect-create";
    commitId: number;
    fiberId: number;
    path?: string[];
  }

  export interface DestroyEffectFiberMessage extends BaseMessage {
    op: "effect-destroy";
    commitId: number;
    fiberId: number;
    path?: string[];
  }

  export type Message =
    | CommitStart
    | MountFiberMessage
    | UpdateFiberMessage
    | BailoutUpdateFiberMessage
    | UnmountFiberMessage
    | CreateEffectFiberMessage
    | DestroyEffectFiberMessage;
}
