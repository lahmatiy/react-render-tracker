import { getInternalReactConstants } from "./utils/getInternalReactConstants";
import {
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
  ElementTypeSuspenseList,
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
} from "./utils/constants.js";
import { ReactInternals, Fiber, NativeType } from "../types";

export type CoreApi = ReturnType<typeof createIntegrationCore>;

export function createIntegrationCore(renderer: ReactInternals) {
  // Newer versions of the reconciler package also specific reconciler version.
  // If that version number is present, use it.
  // Third party renderer versions may not match the reconciler version,
  // and the latter is what's important in terms of tags and symbols.
  const version = renderer.reconcilerVersion || renderer.version || "";

  const {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactTypeOfSideEffect,
  } = getInternalReactConstants(version);

  const {
    ClassComponent,
    DehydratedSuspenseComponent,
    ForwardRef,
    Fragment,
    FunctionComponent,
    HostRoot,
    HostPortal,
    HostComponent,
    HostText,
    IncompleteClassComponent,
    IndeterminateComponent,
    LegacyHiddenComponent,
    MemoComponent,
    OffscreenComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
  } = ReactTypeOfWork;

  // Map of one or more Fibers in a pair to their unique id number.
  // We track both Fibers to support Fast Refresh,
  // which may forcefully replace one of the pair as part of hot reloading.
  // In that case it's still important to be able to locate the previous ID during subsequent renders.
  const fiberToIDMap = new Map<Fiber, number>();
  let fiberIdSeed = 1;

  // Map of id to one (arbitrary) Fiber in a pair.
  // This Map is used to e.g. get the display name for a Fiber or schedule an update,
  // operations that should be the same whether the current and work-in-progress Fiber is used.
  const idToArbitraryFiberMap = new Map<number, Fiber>();

  // Roots don't have a real persistent identity.
  // A root's "pseudo key" is "childDisplayName:indexWithThatName".
  // For example, "App:0" or, in case of similar roots, "Story:0", "Story:1", etc.
  // We will use this to try to disambiguate roots when restoring selection between reloads.
  const rootPseudoKeys = new Map();
  const rootDisplayNameCounter = new Map();

  // NOTICE Keep in sync with get*ForFiber methods
  function shouldFilterFiber(fiber: Fiber) {
    switch (fiber.tag) {
      case DehydratedSuspenseComponent:
        // TODO: ideally we would show dehydrated Suspense immediately.
        // However, it has some special behavior (like disconnecting
        // an alternate and turning into real Suspense) which breaks DevTools.
        // For now, ignore it, and only show it once it gets hydrated.
        // https://github.com/bvaughn/react-devtools-experimental/issues/197
        return true;

      case HostPortal:
      case HostComponent:
      case HostText:
      case Fragment:
      case LegacyHiddenComponent:
      case OffscreenComponent:
        return true;

      case HostRoot:
        // It is never valid to filter the root element.
        return false;

      default:
        switch (getTypeSymbol(fiber.type)) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return true;

          default:
            return false;
        }
    }
  }

  // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  function getElementTypeForFiber(fiber: Fiber) {
    const { type, tag } = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
        return ElementTypeClass;
      case FunctionComponent:
      case IndeterminateComponent:
        return ElementTypeFunction;
      case ForwardRef:
        return ElementTypeForwardRef;
      case HostRoot:
        return ElementTypeRoot;
      case HostComponent:
        return ElementTypeHostComponent;
      case HostPortal:
      case HostText:
      case Fragment:
        return ElementTypeOtherOrUnknown;
      case MemoComponent:
      case SimpleMemoComponent:
        return ElementTypeMemo;
      case SuspenseComponent:
        return ElementTypeSuspense;
      case SuspenseListComponent:
        return ElementTypeSuspenseList;
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return ElementTypeOtherOrUnknown;
          case PROVIDER_NUMBER:
          case PROVIDER_SYMBOL_STRING:
            return ElementTypeContext;
          case CONTEXT_NUMBER:
          case CONTEXT_SYMBOL_STRING:
            return ElementTypeContext;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return ElementTypeOtherOrUnknown;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            return ElementTypeProfiler;
          default:
            return ElementTypeOtherOrUnknown;
        }
    }
  }

  function getDisplayNameForRoot(fiber: Fiber) {
    let preferredDisplayName = null;
    let fallbackDisplayName = null;
    let child = fiber.child;

    // Go at most three levels deep into direct children
    // while searching for a child that has a displayName.
    for (let i = 0; i < 3; i++) {
      if (child === null) {
        break;
      }

      const displayName = getDisplayNameForFiber(child);
      if (displayName !== null) {
        // Prefer display names that we get from user-defined components.
        // We want to avoid using e.g. 'Suspense' unless we find nothing else.
        if (typeof child.type === "function") {
          // There's a few user-defined tags, but we'll prefer the ones
          // that are usually explicitly named (function or class components).
          preferredDisplayName = displayName;
        } else if (fallbackDisplayName === null) {
          fallbackDisplayName = displayName;
        }
      }

      if (preferredDisplayName !== null) {
        break;
      }

      child = child.child;
    }

    return preferredDisplayName || fallbackDisplayName || "Anonymous";
  }

  // Returns the unique ID for a Fiber or generates and caches a new one if the Fiber hasn't been seen before.
  // Once this method has been called for a Fiber, untrackFiberID() should always be called later to avoid leaking.
  function getOrGenerateFiberID(fiber: Fiber) {
    let id: number | undefined;
    const { alternate } = fiber;

    if (fiberToIDMap.has(fiber)) {
      id = fiberToIDMap.get(fiber);
    } else {
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        id = fiberToIDMap.get(alternate);
      }
    }

    if (typeof id === "undefined") {
      id = ++fiberIdSeed;
    }

    // Make sure we're tracking this Fiber
    // e.g. if it just mounted or an error was logged during initial render.
    if (!fiberToIDMap.has(fiber)) {
      fiberToIDMap.set(fiber, id);
      idToArbitraryFiberMap.set(id, fiber);
    }

    // Also make sure we're tracking its alternate,
    // e.g. in case this is the first update after mount.
    if (alternate !== null && !fiberToIDMap.has(alternate)) {
      fiberToIDMap.set(alternate, id);
    }

    return id;
  }

  // Returns an ID if one has already been generated for the Fiber or null if one has not been generated.
  // Use this method while e.g. logging to avoid over-retaining Fibers.
  function getFiberIDUnsafe(fiber: Fiber) {
    if (fiberToIDMap.has(fiber)) {
      return fiberToIDMap.get(fiber) || null;
    }

    const { alternate } = fiber;
    if (alternate !== null && fiberToIDMap.has(alternate)) {
      return fiberToIDMap.get(alternate) || null;
    }

    return null;
  }

  // Returns an ID if one has already been generated for the Fiber or throws.
  function getFiberIDThrows(fiber: Fiber) {
    const id = getFiberIDUnsafe(fiber);

    if (id === null) {
      throw Error(
        `Could not find ID for Fiber "${getDisplayNameForFiber(fiber) || ""}"`
      );
    }

    return id;
  }

  function getFiberByID(id: number) {
    return idToArbitraryFiberMap.get(id) || null;
  }

  function findFiberByHostInstance(hostInstance: NativeType) {
    return renderer.findFiberByHostInstance(hostInstance);
  }

  function removeFiber(fiber: Fiber) {
    idToArbitraryFiberMap.delete(getFiberIDUnsafe(fiber) as number);
    fiberToIDMap.delete(fiber);
    fiberToIDMap.delete(fiber.alternate as Fiber);
  }

  function setRootPseudoKey(id: number, fiber: Fiber) {
    const name = getDisplayNameForRoot(fiber);
    const counter = rootDisplayNameCounter.get(name) || 0;
    const pseudoKey = `${name}:${counter}`;

    rootDisplayNameCounter.set(name, counter + 1);
    rootPseudoKeys.set(id, pseudoKey);
  }

  function getRootPseudoKey(id: number) {
    return rootPseudoKeys.get(id) || null;
  }

  function removeRootPseudoKey(id: number) {
    const pseudoKey = rootPseudoKeys.get(id);

    if (pseudoKey === undefined) {
      throw new Error("Expected root pseudo key to be known.");
    }

    const name = pseudoKey.substring(0, pseudoKey.lastIndexOf(":"));
    const counter = rootDisplayNameCounter.get(name);

    if (counter === undefined) {
      throw new Error("Expected counter to be known.");
    }

    if (counter > 1) {
      rootDisplayNameCounter.set(name, counter - 1);
    } else {
      rootDisplayNameCounter.delete(name);
    }

    rootPseudoKeys.delete(id);
  }

  return {
    ReactTypeOfSideEffect,
    ReactTypeOfWork,
    ReactPriorityLevels,
    getOrGenerateFiberID,
    getFiberIDThrows,
    getFiberIDUnsafe,
    getFiberByID,
    removeFiber,
    getElementTypeForFiber,
    getDisplayNameForFiber,
    getDisplayNameForRoot,
    setRootPseudoKey,
    getRootPseudoKey,
    removeRootPseudoKey,
    shouldFilterFiber,
    findFiberByHostInstance,
  };
}
