// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type TransferElement = {
  id: number;
  parentId: number;
  children: Array<number>;
  type: ElementType;
  displayName: string | null;
  key: number | string | null;

  hocDisplayNames: null | Array<string>;

  // Owner (if available)
  ownerId: number;

  // How many levels deep within the tree is this element?
  // This determines how much indentation (left padding) should be used in the Elements tree.
  depth: number;
};

export type TransferChangeDescription = {
  isFirstMount: boolean;
  parentUpdate: boolean;
  context: Array<string> | boolean | null;
  hooks?: Array<any> | null;
  props: Array<{ name: string; changed: boolean }> | null;
  state: Array<{ name: string; changed: boolean }> | null;
};

export interface AddElementMessage {
  op: "add";
  id: number;
  timestamp: number;
  element: TransferElement;
}

export interface RemoveElementMessage {
  op: "remove";
  id: number;
  timestamp: number;
}

export interface UpdateElementMessage {
  op: "update";
  id: number;
  timestamp: number;
  changes: TransferChangeDescription;
}

export interface BaseDurationMessage {
  op: "basedur";
  id: number;
  base: number;
}

export type Message =
  | AddElementMessage
  | RemoveElementMessage
  | UpdateElementMessage
  | BaseDurationMessage;
