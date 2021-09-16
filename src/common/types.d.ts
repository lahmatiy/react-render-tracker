declare module "common-types" {
  // Different types of elements displayed in the Elements tree.
  // These types may be used to visually distinguish types,
  // or to enable/disable certain functionality.
  export type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

  export type TransferFiber = {
    id: number;
    type: FiberType;
    key: number | string | null;
    displayName: string | null;
    hocDisplayNames: string[] | null;
    parentId: number;
    ownerId: number; // Owner (if available)
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
  export type TransferNamedEntryChange = {
    index?: number;
    name: string;
    prev: string;
    next: string;
    location?: string;
    path?: string[];
    diff?: TransferObjectDiff | TransferArrayDiff | false;
  };
  export type TransferFiberChanges = {
    props?: TransferNamedEntryChange[];
    context?: TransferNamedEntryChange[];
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
