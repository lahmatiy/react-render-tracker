declare module "common-types" {
  export type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  export type TransferFiber = {
    id: number;
    type: FiberType;
    typeId: number;
    key: number | string | null;
    ownerId: number; // Owner (if available)
    parentId: number;
    displayName: string | null;
    hocDisplayNames: string[] | null;
  };

  export type TransferHookInfo = {
    name: string;
    context: number | null;
    deps: number | null;
    trace: TransferCallTrace;
  };

  export type TransferFiberTypeDef = {
    contexts: TransferFiberContext[] | null;
    hooks: TransferHookInfo[];
  };

  export type TransferFiberContext = {
    name: string;
    providerId?: number;
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
  export type TransferPropChange = {
    name: string;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
  };
  export type TransferContextChange = {
    context: number;
    valueChangedEventId: number;
  };
  export type TransferStateChange = {
    hook: number | null;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
    calls?: null | Array<{ name: string; loc: null | string }>;
  };
  export type TransferDepChange = {
    index: number;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
  };
  export type TransferMemoChange = {
    hook: number;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
    deps: TransferDepChange[];
  };
  export type TransferFiberChanges = {
    props?: TransferPropChange[];
    context?: TransferContextChange[];
    state?: TransferStateChange[];
    memos?: TransferMemoChange[];
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

  export interface CommitStartMessage extends BaseMessage {
    op: "commit-start";
    commitId: number;
    triggers: CommitTrigger[];
  }

  export interface FiberTypeDefMessage extends BaseMessage {
    op: "fiber-type-def";
    typeId: number;
    definition: TransferFiberTypeDef;
  }

  export interface MountFiberMessage extends BaseMessage {
    op: "mount";
    commitId: number;
    fiberId: number;
    fiber: TransferFiber;
    props: string[];
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

  export interface UpdateBailoutStateFiberMessage extends BaseMessage {
    op: "update-bailout-state";
    commitId: number;
    fiberId: number;
    trigger?: number;
  }

  export interface UpdateBailoutMemoFiberMessage extends BaseMessage {
    op: "update-bailout-memo";
    commitId: number;
    fiberId: number;
    trigger?: number;
  }

  export interface UpdateBailoutSCUFiberMessage extends BaseMessage {
    op: "update-bailout-scu";
    commitId: number;
    fiberId: number;
    changes: TransferFiberChanges | null;
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
    | FiberTypeDefMessage
    | CommitStartMessage
    | MountFiberMessage
    | UpdateFiberMessage
    | UpdateBailoutStateFiberMessage
    | UpdateBailoutMemoFiberMessage
    | UpdateBailoutSCUFiberMessage
    | UnmountFiberMessage
    | CreateEffectFiberMessage
    | DestroyEffectFiberMessage;
}
