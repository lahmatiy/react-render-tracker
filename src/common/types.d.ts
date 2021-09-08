declare module "common-types" {
  // Different types of elements displayed in the Elements tree.
  // These types may be used to visually distinguish types,
  // or to enable/disable certain functionality.
  export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

  export type TransferElement = {
    id: number;
    type: ElementType;
    key: number | string | null;
    displayName: string | null;
    hocDisplayNames: null | Array<string>;
    parentId: number;
    ownerId: number; // Owner (if available)
  };

  export type TransferChangeDescription = {
    props: Array<{ name: string; prev: string; next: string }> | null;
    state?: Array<{ name: string; prev: string; next: string }> | null;
    context?: Array<{ name: string; prev: string; next: string }> | null;
    hooks?: Array<{
      index: number;
      name: string;
      prev: string;
      next: string;
      // computed?: boolean;
    }> | null;
  };

  export interface BaseMessage {
    op: string;
    id: number;
    timestamp: number;
    commitId: number;
    elementId: number;
  }

  export interface MountElementMessage extends BaseMessage {
    op: "mount";
    element: TransferElement;
    totalTime: number;
    selfTime: number;
  }

  export interface UnmountElementMessage extends BaseMessage {
    op: "unmount";
  }

  export interface RenderElementMessage extends BaseMessage {
    op: "rerender";
    totalTime: number;
    selfTime: number;
    ownerUpdate: boolean;
    changes: TransferChangeDescription | null;
  }

  export type Message =
    | MountElementMessage
    | UnmountElementMessage
    | RenderElementMessage;
}
