declare module "common-types" {
  export type ReactRendererInfo = {
    id: number;
    name: string;
    version: string;
    bundleType: RendererBundleType;
    channelId: `events:${number}`;
  };
  export type ReactUnsupportedRendererInfo = Omit<
    ReactRendererInfo,
    "channelId"
  > & {
    reason: string;
  };
  export type RendererBundleType =
    | "development"
    | "profiling"
    | "production"
    | "unknown";

  export type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  export type FiberRootMode = 0 | 1 | 2;

  export type TransferFiber = {
    id: number;
    type: FiberType;
    typeId: number;
    rootMode?: FiberRootMode;
    key: number | string | null;
    ownerId: number; // Owner (if available)
    parentId: number;
    displayName: string | null;
    hocDisplayNames: string[] | null;
    loc: string | null;
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
    type: "initial-mount" | "event" | "effect" | "layout-effect" | "unknown";
    kind: "mount" | "setState" | "forceUpdate" | "useReducer" | "useState";
    fiberId: number;
    relatedFiberId?: number;
    event?: string;
    loc: string | null;
  };

  export interface BaseMessage {
    op: string;
    id: number;
    commitId: number;
  }

  export interface CommitStartMessage extends BaseMessage {
    op: "commit-start";
    triggers: CommitTrigger[];
  }

  export interface FiberTypeDefMessage extends BaseMessage {
    op: "fiber-type-def";
    typeId: number;
    definition: TransferFiberTypeDef;
  }

  export interface MountFiberMessage extends BaseMessage {
    op: "mount";
    fiberId: number;
    fiber: TransferFiber;
    props: string[];
    totalTime: number;
    selfTime: number;
    trigger?: number;
  }

  export interface UpdateFiberMessage extends BaseMessage {
    op: "update";
    fiberId: number;
    totalTime: number;
    selfTime: number;
    changes: TransferFiberChanges | null;
    specialReasons: Array<{ name: string; loc: string | null }> | null;
    trigger?: number;
  }

  export interface UpdateBailoutStateFiberMessage extends BaseMessage {
    op: "update-bailout-state";
    fiberId: number;
    trigger?: number;
  }

  export interface UpdateBailoutMemoFiberMessage extends BaseMessage {
    op: "update-bailout-memo";
    fiberId: number;
    trigger?: number;
  }

  export interface UpdateBailoutSCUFiberMessage extends BaseMessage {
    op: "update-bailout-scu";
    fiberId: number;
    changes: TransferFiberChanges | null;
    trigger?: number;
  }

  export interface UnmountFiberMessage extends BaseMessage {
    op: "unmount";
    fiberId: number;
    trigger?: number;
  }

  export interface CreateEffectFiberMessage extends BaseMessage {
    op: "effect-create";
    fiberId: number;
    path?: string[];
  }

  export interface DestroyEffectFiberMessage extends BaseMessage {
    op: "effect-destroy";
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
