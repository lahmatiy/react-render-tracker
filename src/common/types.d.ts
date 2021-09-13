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

  export type TransferNamedEntryChange = {
    name: string;
    prev: string;
    next: string;
  };
  export type TransferHookStateChange = {
    index: number;
    name: string;
    prev: string;
    next: string;
  };
  export type TransferFiberChanges = {
    props?: TransferNamedEntryChange[];
    state?: TransferNamedEntryChange[];
    context?: TransferNamedEntryChange[];
    hooks?: TransferHookStateChange[];
  };

  export interface BaseMessage {
    op: string;
    id: number;
    timestamp: number;
    commitId: number;
    fiberId: number;
  }

  export interface MountElementMessage extends BaseMessage {
    op: "mount";
    fiber: TransferFiber;
    totalTime: number;
    selfTime: number;
  }

  export interface UnmountElementMessage extends BaseMessage {
    op: "unmount";
  }

  export interface UpdateElementMessage extends BaseMessage {
    op: "update";
    totalTime: number;
    selfTime: number;
    changes: TransferFiberChanges | null;
  }

  export type Message =
    | MountElementMessage
    | UnmountElementMessage
    | UpdateElementMessage;
}
