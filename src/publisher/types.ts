import { ElementType } from "../common/types";
export * from "../common/types";

// FIXME
export type ReactRenderer = any;
type FindNativeNodesForFiberID = any;
type GetDisplayNameForFiberID = any;
type GetFiberIDForNative = any;

type Type = "props" | "hooks" | "state" | "context";

export type PathFrame = {
  key: string | null;
  index: number;
  displayName: string | null;
};

export type PathMatch = {
  id: number;
  isFullMatch: boolean;
};

export type SerializedElement = {
  displayName: string | null;
  id: number;
  key: number | string | null;
  type: ElementType;
};

export type OwnersList = {
  id: number;
  owners: Array<SerializedElement> | null;
};

export type ReactChangeDescription = {
  context: Array<string> | boolean | null;
  didHooksChange: boolean;
  isFirstMount: boolean;
  parentUpdate: boolean;
  props: Array<{ name: string; prev: any; next: any }> | null;
  state: Array<{ name: string; prev: any; next: any }> | null;
  // TODO: add proper hook type
  hooks?: Array<any> | null;
};

export type ReactCommitData = {
  commitTime: number;
  // Tuple of fiber ID and change description
  changeDescriptions: Map<number, ReactChangeDescription> | null;
  duration: number;
  // Only available in certain (newer) React builds,
  effectDuration: number | null;
  // Tuple of fiber ID and actual duration
  fiberActualDurations: Array<[number, number]>;
  // Tuple of fiber ID and computed "self" duration
  fiberSelfDurations: Array<[number, number]>;
  // Only available in certain (newer) React builds,
  passiveEffectDuration: number | null;
  priorityLevel: string | null;
  timestamp: number;
  updaters: Array<SerializedElement> | null;
};

export type Source = {
  fileName: string;
  lineNumber: number;
};

export type InspectedElement = {
  id: number;

  displayName: string | null;

  // Does the current renderer support editable hooks and function props?
  canEditHooks: boolean;
  canEditFunctionProps: boolean;

  // Does the current renderer support advanced editing interface?
  canEditHooksAndDeletePaths: boolean;
  canEditHooksAndRenamePaths: boolean;
  canEditFunctionPropsDeletePaths: boolean;
  canEditFunctionPropsRenamePaths: boolean;

  // Is this Error, and can its value be overridden now?
  canToggleError: boolean;
  isErrored: boolean;
  targetErrorBoundaryID?: number;

  // Is this Suspense, and can its value be overridden now?
  canToggleSuspense: boolean;

  // Can view component source location.
  canViewSource: boolean;

  // Does the component have legacy context attached to it.
  hasLegacyContext: boolean;

  // Inspectable properties.
  context: Object | null;
  hooks: Object | null;
  props: Object | null;
  state: Object | null;
  key: number | string | null;
  errors: Array<[string, number]>;
  warnings: Array<[string, number]>;

  // List of owners
  owners: Array<SerializedElement> | null;

  // Location of component in source code.
  source: Source | null;

  type: ElementType;

  // Meta information about the root this element belongs to.
  rootType: string | null;

  // Meta information about the renderer that created this element.
  rendererPackageName: string | null;
  rendererVersion: string | null;
};

export type InspectElementFullData = {
  id: number;
  responseID: number;
  type: "full-data";
  value: InspectedElement;
};

export type InspectElementHydratedPath = {
  id: number;
  responseID: number;
  type: "hydrated-path";
  path: Array<string | number>;
  value: any;
};

export type InspectElementNoChange = {
  id: number;
  responseID: number;
  type: "no-change";
};

export type InspectElementNotFound = {
  id: number;
  responseID: number;
  type: "not-found";
};

export type InspectedElementPayload =
  | InspectElementFullData
  | InspectElementHydratedPath
  | InspectElementNoChange
  | InspectElementNotFound;

export type RendererInterface = {
  handleCommitFiberRoot: (fiber: Object, commitPriority?: number) => void;
  handleCommitFiberUnmount: (fiber: Object) => void;
  handlePostCommitFiberRoot: (fiber: Object) => void;

  findNativeNodesForFiberID: FindNativeNodesForFiberID;
  getFiberIDForNative: GetFiberIDForNative;
  getDisplayNameForFiberID: GetDisplayNameForFiberID;
  getOwnersList: (id: number) => Array<SerializedElement> | null;
  getPathForElement: (id: number) => Array<PathFrame> | null;
  inspectElement: (
    requestID: number,
    id: number,
    inspectedPaths: Object
  ) => InspectedElementPayload;
};
