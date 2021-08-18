// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type TransferElement = {
  id: number;
  parentId: number;
  type: ElementType;
  displayName: string | null;
  key: number | string | null;

  hocDisplayNames: null | Array<string>;

  // Owner (if available)
  ownerId: number;
};

export type TransferChangeDescription = {
  isFirstMount: boolean;
  parentUpdate: boolean;
  context: Array<string> | boolean | null;
  hooks?: Array<any> | null;
  props: Array<{ name: string; changed: boolean }> | null;
  state: Array<{ name: string; changed: boolean }> | null;
};

export interface BaseMessage {
  op: string;
  id: number;
  timestamp: number;
  elementId: number;
}

export interface MountElementMessage extends BaseMessage {
  op: "mount";
  element: TransferElement;
}

export interface UnmountElementMessage extends BaseMessage {
  op: "unmount";
}

export interface RenderElementMessage extends BaseMessage {
  op: "render";
  initial?: boolean;
  actualDuration: number;
  selfDuration: number;
  changes: TransferChangeDescription;
}

export type Message =
  | MountElementMessage
  | UnmountElementMessage
  | RenderElementMessage;
