import {
  TransferElement,
  ElementType,
  MountElementMessage,
  UnmountElementMessage,
  RenderElementMessage,
} from "../common/types";
export * from "../common/types";

export type Event =
  | MountElementMessage
  | UnmountElementMessage
  | RenderElementMessage;

export interface MessageElement extends TransferElement {
  mounted: boolean;
  events: any[];
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
  events: Event[];
};

export interface ElementEvent {
  component: TreeElement;
  event: Event;
}
