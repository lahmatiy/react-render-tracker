// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type Element = {
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
  context: Array<string> | boolean | null;
  didHooksChange: boolean;
  isFirstMount: boolean;
  parentUpdate: boolean;
  props: Array<{ name: string; changed: boolean }> | null;
  state: Array<{ name: string; changed: boolean }> | null;
  // TODO: add proper hook type
  hooks?: Array<any> | null;
};

export interface AddElementMessage {
  op: "add";
  id: number;
  element: Element;
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

export type Message =
  | AddElementMessage
  | RemoveElementMessage
  | UpdateElementMessage;
