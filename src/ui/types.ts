import {
  Element,
  ElementType,
  TransferChangeDescription,
} from "../comon-types";
export * from "../comon-types";

export interface MessageElement extends Element {
  mounted: boolean;
  updates: any[];
}
// FIXME: a hack to override children
export type TreeElement = {
  id: number;
  type: ElementType;
  key: number | string | null;
  parentId: number;
  ownerId: number;
  children: TreeElement[];
  displayName: string | null;
  hocDisplayNames: null | Array<string>;
  mounted: boolean;
  updates: ElementUpdate[];
};

export interface ElementUpdate {
  phase: "Mount" | "Update" | "Unmount";
  timestamp: number;
  reason: string[];
  details: {
    hooks?: TransferChangeDescription["hooks"];
    props?: TransferChangeDescription["props"];
    state?: TransferChangeDescription["state"];
  };
  __orig: TransferChangeDescription;
}

export interface ElementEvent {
  component: TreeElement;
  event: ElementUpdate;
}
