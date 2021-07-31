// FIXME
export type ReactRenderer = any;

type ComponentFilter = any;
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

export type TransferChangeDescription = {
  context: Array<string> | boolean | null;
  didHooksChange: boolean;
  isFirstMount: boolean;
  props: Array<{ name: string; changed: boolean }> | null;
  state: Array<{ name: string; changed: boolean }> | null;
  // TODO: add proper hook type
  hooks?: Array<any> | null;
};

export type TransferCommitData = {
  commitTime: number;
  // Tuple of fiber ID and change description
  changeDescriptions: { [key: number]: TransferChangeDescription } | null;
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

export type ProfilingDataForRootBackend = {
  commitData: Array<ReactCommitData>;
  displayName: string;
  // Tuple of Fiber ID and base duration
  initialTreeBaseDurations: Array<[number, number]>;
  rootID: number;
};

export type ProfilingDataBackend = {
  dataForRoots: Array<ProfilingDataForRootBackend>;
  rendererID: number;
};

export type InstanceAndStyle = {
  instance: Object | null;
  style: Object | null;
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
  cleanup: () => void;
  clearErrorsAndWarnings: () => void;
  clearErrorsForFiberID: (id: number) => void;
  clearWarningsForFiberID: (id: number) => void;
  copyElementPath: (id: number, path: Array<string | number>) => void;
  deletePath: (
    type: Type,
    id: number,
    hookID: number | undefined,
    path: Array<string | number>
  ) => void;
  findNativeNodesForFiberID: FindNativeNodesForFiberID;
  flushInitialOperations: () => void;
  getBestMatchForTrackedPath: () => PathMatch | null;
  getFiberIDForNative: GetFiberIDForNative;
  getDisplayNameForFiberID: GetDisplayNameForFiberID;
  getInstanceAndStyle(id: number): InstanceAndStyle;
  getProfilingData(): ProfilingDataBackend;
  getOwnersList: (id: number) => Array<SerializedElement> | null;
  getPathForElement: (id: number) => Array<PathFrame> | null;
  handleCommitFiberRoot: (fiber: Object, commitPriority?: number) => void;
  handleCommitFiberUnmount: (fiber: Object) => void;
  handlePostCommitFiberRoot: (fiber: Object) => void;
  inspectElement: (
    requestID: number,
    id: number,
    inspectedPaths: Object
  ) => InspectedElementPayload;
  logElementToConsole: (id: number) => void;
  overrideError: (id: number, forceError: boolean) => void;
  overrideSuspense: (id: number, forceFallback: boolean) => void;
  overrideValueAtPath: (
    type: Type,
    id: number,
    hook: number | undefined,
    path: Array<string | number>,
    value: any
  ) => void;
  prepareViewAttributeSource: (
    id: number,
    path: Array<string | number>
  ) => void;
  prepareViewElementSource: (id: number) => void;
  renamePath: (
    type: Type,
    id: number,
    hookID: number | undefined,
    oldPath: Array<string | number>,
    newPath: Array<string | number>
  ) => void;
  renderer: ReactRenderer | null;
  setTraceUpdatesEnabled: (enabled: boolean) => void;
  setTrackedPath: (path: Array<PathFrame> | null) => void;
  startProfiling: (recordChangeDescriptions: boolean) => void;
  stopProfiling: () => void;
  storeAsGlobal: (
    id: number,
    path: Array<string | number>,
    count: number
  ) => void;
  updateComponentFilters: (componentFilters: Array<ComponentFilter>) => void;
};

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

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface AddElementMessage {
  op: "add";
  id: number;
  element: Element;
}

export interface RemoveElementMessage {
  op: "remove";
  id: number;
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
