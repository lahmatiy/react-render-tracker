declare module "common-types" {
  export type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  export type TransferFiberContext = {
    name: string;
    providerId?: number;
    reads?: Array<{
      index: number;
      path: string[] | undefined;
    }>;
  };

  export type TransferFiber = {
    id: number;
    type: FiberType;
    key: number | string | null;
    ownerId: number; // Owner (if available)
    parentId: number;
    displayName: string | null;
    hocDisplayNames: string[] | null;
    contexts: TransferFiberContext[] | null;
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
    location?: string;
    path?: string[];
    paths?: Array<string[] | undefined>;
    diff?: TransferChangeDiff;
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

  export interface BaseMessage {
    op: string;
    id: number;
    timestamp: number;
    commitId: number;
    fiberId: number;
  }

  export interface MountFiberMessage extends BaseMessage {
    op: "mount";
    fiber: TransferFiber;
    totalTime: number;
    selfTime: number;
  }

  export interface UnmountFiberMessage extends BaseMessage {
    op: "unmount";
  }

  export interface UpdateFiberMessage extends BaseMessage {
    op: "update";
    totalTime: number;
    selfTime: number;
    changes: TransferFiberChanges | null;
    trigger?: number;
  }

  export interface CreateEffectFiberMessage extends BaseMessage {
    op: "effect-create";
    path?: string[];
  }

  export interface DestroyEffectFiberMessage extends BaseMessage {
    op: "effect-destroy";
    path?: string[];
  }

  export type Message =
    | MountFiberMessage
    | UnmountFiberMessage
    | UpdateFiberMessage
    | CreateEffectFiberMessage
    | DestroyEffectFiberMessage;
}
