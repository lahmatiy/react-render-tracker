import { gt, gte } from "semver";
// import { inspectHooksOfFiber } from "react-debug-tools";

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
  TREE_OPERATION_MOUNT,
  TREE_OPERATION_UNMOUNT,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  MEMO_NUMBER,
  MEMO_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  SCOPE_NUMBER,
  SCOPE_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
} from "./constants.js";

import {
  cleanForBridge,
  getDisplayName,
  getEffectDurations,
  getInObject,
  getUID,
  utfEncodeString,
} from "./utils";

function getFiberFlags(fiber) {
  // The name of this field changed from "effectTag" to "flags"
  return fiber.flags !== undefined ? fiber.flags : fiber.effectTag;
}

const getCurrentTime =
  typeof performance === "object" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

export function getInternalReactConstants(version) {
  const ReactTypeOfSideEffect = {
    DidCapture: 0b10000000,
    NoFlags: 0b00,
    PerformedWork: 0b01,
    Placement: 0b10,
    Incomplete: 0b10000000000000,
  };

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  //
  // Technically these priority levels are invalid for versions before 16.9,
  // but 16.9 is the first version to report priority level to DevTools,
  // so we can avoid checking for earlier versions and support pre-16.9 canary releases in the process.
  let ReactPriorityLevels = {
    ImmediatePriority: 99,
    UserBlockingPriority: 98,
    NormalPriority: 97,
    LowPriority: 96,
    IdlePriority: 95,
    NoPriority: 90,
  };

  if (gt(version, "17.0.2")) {
    ReactPriorityLevels = {
      ImmediatePriority: 1,
      UserBlockingPriority: 2,
      NormalPriority: 3,
      LowPriority: 4,
      IdlePriority: 5,
      NoPriority: 0,
    };
  }

  let ReactTypeOfWork = null;

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  //
  // TODO Update the gt() check below to be gte() whichever the next version number is.
  // Currently the version in Git is 17.0.2 (but that version has not been/may not end up being released).
  if (gt(version, "17.0.1")) {
    ReactTypeOfWork = {
      CacheComponent: 24, // Experimental
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
      ForwardRef: 11,
      Fragment: 7,
      FunctionComponent: 0,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: 17,
      IndeterminateComponent: 2,
      LazyComponent: 16,
      LegacyHiddenComponent: 23,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: 22, // Experimental
      Profiler: 12,
      ScopeComponent: 21, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, "17.0.0-alpha")) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
      ForwardRef: 11,
      Fragment: 7,
      FunctionComponent: 0,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: 17,
      IndeterminateComponent: 2,
      LazyComponent: 16,
      LegacyHiddenComponent: 24,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: 23, // Experimental
      Profiler: 12,
      ScopeComponent: 21, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, "16.6.0-beta.0")) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
      ForwardRef: 11,
      Fragment: 7,
      FunctionComponent: 0,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: 17,
      IndeterminateComponent: 2,
      LazyComponent: 16,
      LegacyHiddenComponent: -1,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: -1, // Experimental
      Profiler: 12,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, "16.4.3-alpha")) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 2,
      ContextConsumer: 11,
      ContextProvider: 12,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: -1, // Doesn't exist yet
      ForwardRef: 13,
      Fragment: 9,
      FunctionComponent: 0,
      HostComponent: 7,
      HostPortal: 6,
      HostRoot: 5,
      HostText: 8,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 4,
      LazyComponent: -1, // Doesn't exist yet
      LegacyHiddenComponent: -1,
      MemoComponent: -1, // Doesn't exist yet
      Mode: 10,
      OffscreenComponent: -1, // Experimental
      Profiler: 15,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
      YieldComponent: -1, // Removed
    };
  } else {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 2,
      ContextConsumer: 12,
      ContextProvider: 13,
      CoroutineComponent: 7,
      CoroutineHandlerPhase: 8,
      DehydratedSuspenseComponent: -1, // Doesn't exist yet
      ForwardRef: 14,
      Fragment: 10,
      FunctionComponent: 1,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 0,
      LazyComponent: -1, // Doesn't exist yet
      LegacyHiddenComponent: -1,
      MemoComponent: -1, // Doesn't exist yet
      Mode: 11,
      OffscreenComponent: -1, // Experimental
      Profiler: 15,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
      YieldComponent: 9,
    };
  }
  // **********************************************************
  // End of copied code.
  // **********************************************************

  function getTypeSymbol(type) {
    const symbolOrNumber =
      typeof type === "object" && type !== null ? type.$$typeof : type;

    // $FlowFixMe Flow doesn't know about typeof "symbol"
    return typeof symbolOrNumber === "symbol"
      ? symbolOrNumber.toString()
      : symbolOrNumber;
  }

  const {
    CacheComponent,
    ClassComponent,
    IncompleteClassComponent,
    FunctionComponent,
    IndeterminateComponent,
    ForwardRef,
    HostRoot,
    HostComponent,
    HostPortal,
    HostText,
    Fragment,
    LazyComponent,
    LegacyHiddenComponent,
    MemoComponent,
    OffscreenComponent,
    Profiler,
    ScopeComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
  } = ReactTypeOfWork;

  function resolveFiberType(type) {
    const typeSymbol = getTypeSymbol(type);
    switch (typeSymbol) {
      case MEMO_NUMBER:
      case MEMO_SYMBOL_STRING:
        // recursively resolving memo type in case of memo(forwardRef(Component))
        return resolveFiberType(type.type);
      case FORWARD_REF_NUMBER:
      case FORWARD_REF_SYMBOL_STRING:
        return type.render;
      default:
        return type;
    }
  }

  // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  function getDisplayNameForFiber(fiber) {
    const { elementType, type, tag } = fiber;

    let resolvedType = type;
    if (typeof type === "object" && type !== null) {
      resolvedType = resolveFiberType(type);
    }

    let resolvedContext;

    switch (tag) {
      case CacheComponent:
        return "Cache";
      case ClassComponent:
      case IncompleteClassComponent:
        return getDisplayName(resolvedType);
      case FunctionComponent:
      case IndeterminateComponent:
        return getDisplayName(resolvedType);
      case ForwardRef:
        // Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
        return (
          (type && type.displayName) ||
          getDisplayName(resolvedType, "Anonymous")
        );
      case HostRoot:
        return null;
      case HostComponent:
        return type;
      case HostPortal:
      case HostText:
      case Fragment:
        return null;
      case LazyComponent:
        // This display name will not be user visible.
        // Once a Lazy component loads its inner component, React replaces the tag and type.
        // This display name will only show up in console logs when DevTools DEBUG mode is on.
        return "Lazy";
      case MemoComponent:
      case SimpleMemoComponent:
        return (
          (elementType && elementType.displayName) ||
          (type && type.displayName) ||
          getDisplayName(resolvedType, "Anonymous")
        );
      case SuspenseComponent:
        return "Suspense";
      case LegacyHiddenComponent:
        return "LegacyHidden";
      case OffscreenComponent:
        return "Offscreen";
      case ScopeComponent:
        return "Scope";
      case SuspenseListComponent:
        return "SuspenseList";
      case Profiler:
        return "Profiler";
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return null;
          case PROVIDER_NUMBER:
          case PROVIDER_SYMBOL_STRING:
            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type.context;
            return `${resolvedContext.displayName || "Context"}.Provider`;
          case CONTEXT_NUMBER:
          case CONTEXT_SYMBOL_STRING:
            // 16.3-16.5 read from "type" because the Consumer is the actual context object.
            // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type;

            // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
            // If you change the name, figure out a more resilient way to detect it.
            return `${resolvedContext.displayName || "Context"}.Consumer`;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return null;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            return `Profiler(${fiber.memoizedProps.id})`;
          case SCOPE_NUMBER:
          case SCOPE_SYMBOL_STRING:
            return "Scope";
          default:
            // Unknown element type.
            // This may mean a new element type that has not yet been added to DevTools.
            return null;
        }
    }
  }

  return {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactTypeOfSideEffect,
  };
}

export function attach(hook, rendererID, renderer) {
  // Newer versions of the reconciler package also specific reconciler version.
  // If that version number is present, use it.
  // Third party renderer versions may not match the reconciler version,
  // and the latter is what's important in terms of tags and symbols.
  const version = renderer.reconcilerVersion || renderer.version;

  const {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactTypeOfSideEffect,
  } = getInternalReactConstants(version);

  const { Incomplete, NoFlags, PerformedWork, Placement } =
    ReactTypeOfSideEffect;

  const {
    CacheComponent,
    ClassComponent,
    ContextConsumer,
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

  const {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
    NoPriority,
  } = ReactPriorityLevels;

  const {
    overrideHookState,
    overrideHookStateDeletePath,
    overrideHookStateRenamePath,
    overrideProps,
    overridePropsDeletePath,
    overridePropsRenamePath,
    setErrorHandler,
    setSuspenseHandler,
    scheduleUpdate,
  } = renderer;

  const supportsTogglingError =
    typeof setErrorHandler === "function" &&
    typeof scheduleUpdate === "function";
  const supportsTogglingSuspense =
    typeof setSuspenseHandler === "function" &&
    typeof scheduleUpdate === "function";

  // Mapping of fiber IDs to error/warning messages and counts.
  const fiberIDToErrorsMap = new Map();
  const fiberIDToWarningsMap = new Map();

  // NOTICE Keep in sync with get*ForFiber methods
  function shouldFilterFiber(fiber) {
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
        const typeSymbol = getTypeSymbol(fiber.type);

        switch (typeSymbol) {
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
  function getElementTypeForFiber(fiber) {
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

  // Map of one or more Fibers in a pair to their unique id number.
  // We track both Fibers to support Fast Refresh,
  // which may forcefully replace one of the pair as part of hot reloading.
  // In that case it's still important to be able to locate the previous ID during subsequent renders.
  const fiberToIDMap = new Map();

  // Map of id to one (arbitrary) Fiber in a pair.
  // This Map is used to e.g. get the display name for a Fiber or schedule an update,
  // operations that should be the same whether the current and work-in-progress Fiber is used.
  const idToArbitraryFiberMap = new Map();

  // When profiling is supported, we store the latest tree base durations for each Fiber.
  // This is so that we can quickly capture a snapshot of those values if profiling starts.
  // If we didn't store these values, we'd have to crawl the tree when profiling started,
  // and use a slow path to find each of the current Fibers.
  const idToTreeBaseDurationMap = new Map();

  // When profiling is supported, we store the latest tree base durations for each Fiber.
  // This map enables us to filter these times by root when sending them to the frontend.
  const idToRootMap = new Map();

  // When a mount or update is in progress, this value tracks the root that is being operated on.
  let currentRootID = -1;

  // Returns the unique ID for a Fiber or generates and caches a new one if the Fiber hasn't been seen before.
  // Once this method has been called for a Fiber, untrackFiberID() should always be called later to avoid leaking.
  function getOrGenerateFiberID(fiber) {
    let id = null;
    if (fiberToIDMap.has(fiber)) {
      id = fiberToIDMap.get(fiber);
    } else {
      const { alternate } = fiber;
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        id = fiberToIDMap.get(alternate);
      }
    }

    if (id === null) {
      id = getUID();
    }

    // This refinement is for Flow purposes only.
    const refinedID = id;

    // Make sure we're tracking this Fiber
    // e.g. if it just mounted or an error was logged during initial render.
    if (!fiberToIDMap.has(fiber)) {
      fiberToIDMap.set(fiber, refinedID);
      idToArbitraryFiberMap.set(refinedID, fiber);
    }

    // Also make sure we're tracking its alternate,
    // e.g. in case this is the first update after mount.
    const { alternate } = fiber;
    if (alternate !== null) {
      if (!fiberToIDMap.has(alternate)) {
        fiberToIDMap.set(alternate, refinedID);
      }
    }

    return refinedID;
  }

  // Returns an ID if one has already been generated for the Fiber or throws.
  function getFiberIDThrows(fiber) {
    const maybeID = getFiberIDUnsafe(fiber);
    if (maybeID !== null) {
      return maybeID;
    }
    throw Error(
      `Could not find ID for Fiber "${getDisplayNameForFiber(fiber) || ""}"`
    );
  }

  // Returns an ID if one has already been generated for the Fiber or null if one has not been generated.
  // Use this method while e.g. logging to avoid over-retaining Fibers.
  function getFiberIDUnsafe(fiber) {
    if (fiberToIDMap.has(fiber)) {
      return fiberToIDMap.get(fiber);
    } else {
      const { alternate } = fiber;
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        return fiberToIDMap.get(alternate);
      }
    }
    return null;
  }

  // Removes a Fiber (and its alternate) from the Maps used to track their id.
  // This method should always be called when a Fiber is unmounting.
  function untrackFiberID(fiber) {
    // Untrack Fibers after a slight delay in order to support a Fast Refresh edge case:
    // 1. Component type is updated and Fast Refresh schedules an update+remount.
    // 2. flushPendingErrorsAndWarningsAfterDelay() runs, sees the old Fiber is no longer mounted
    //    (it's been disconnected by Fast Refresh), and calls untrackFiberID() to clear it from the Map.
    // 3. React flushes pending passive effects before it runs the next render,
    //    which logs an error or warning, which causes a new ID to be generated for this Fiber.
    // 4. DevTools now tries to unmount the old Component with the new ID.
    //
    // The underlying problem here is the premature clearing of the Fiber ID,
    // but DevTools has no way to detect that a given Fiber has been scheduled for Fast Refresh.
    // (The "_debugNeedsRemount" flag won't necessarily be set.)
    //
    // The best we can do is to delay untracking by a small amount,
    // and give React time to process the Fast Refresh delay.

    untrackFibersSet.add(fiber);

    if (untrackFibersTimeoutID === null) {
      untrackFibersTimeoutID = setTimeout(untrackFibers, 1000);
    }
  }

  const untrackFibersSet = new Set();
  let untrackFibersTimeoutID = null;

  function untrackFibers() {
    if (untrackFibersTimeoutID !== null) {
      clearTimeout(untrackFibersTimeoutID);
      untrackFibersTimeoutID = null;
    }

    untrackFibersSet.forEach(fiber => {
      const fiberID = getFiberIDUnsafe(fiber);
      if (fiberID !== null) {
        idToArbitraryFiberMap.delete(fiberID);
      }

      fiberToIDMap.delete(fiber);

      const { alternate } = fiber;
      if (alternate !== null) {
        fiberToIDMap.delete(alternate);
      }
    });
    untrackFibersSet.clear();
  }

  function getChangeDescription(prevFiber, nextFiber) {
    switch (getElementTypeForFiber(nextFiber)) {
      case ElementTypeClass:
      case ElementTypeFunction:
      case ElementTypeMemo:
      case ElementTypeForwardRef:
        if (prevFiber === null) {
          return {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          };
        } else {
          const data = {
            context: getContextChangedKeys(nextFiber),
            didHooksChange: false,
            isFirstMount: false,
            props: getChangedKeys(
              prevFiber.memoizedProps,
              nextFiber.memoizedProps
            ),
            state: getChangedKeys(
              prevFiber.memoizedState,
              nextFiber.memoizedState
            ),
          };

          // Only traverse the hooks list once, depending on what info we're returning.
          const indices = getChangedHooksIndices(
            prevFiber.memoizedState,
            nextFiber.memoizedState
          );
          const didHooksChange = indices !== null && indices.length > 0;
          data.hooks = indices;
          data.didHooksChange = didHooksChange;

          if (
            !data.didHooksChange &&
            !data.state &&
            !data.props &&
            !data.context
          ) {
            data.parentUpdate = true;
          }

          return data;
        }
      default:
        return null;
    }
  }

  function updateContextsForFiber(fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        if (idToContextsMap !== null) {
          const id = getFiberIDThrows(fiber);
          const contexts = getContextsForFiber(fiber);
          if (contexts !== null) {
            idToContextsMap.set(id, contexts);
          }
        }
        break;
      default:
        break;
    }
  }

  // Differentiates between a null context value and no context.
  const NO_CONTEXT = {};

  function getContextsForFiber(fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        const instance = fiber.stateNode;
        let legacyContext = NO_CONTEXT;
        let modernContext = NO_CONTEXT;
        if (instance != null) {
          if (
            instance.constructor &&
            instance.constructor.contextType != null
          ) {
            modernContext = instance.context;
          } else {
            legacyContext = instance.context;
            if (legacyContext && Object.keys(legacyContext).length === 0) {
              legacyContext = NO_CONTEXT;
            }
          }
        }
        return [legacyContext, modernContext];
      default:
        return null;
    }
  }

  // Record all contexts at the time profiling is started.
  // Fibers only store the current context value,
  // so we need to track them separately in order to determine changed keys.
  function crawlToInitializeContextsMap(fiber) {
    updateContextsForFiber(fiber);
    let current = fiber.child;
    while (current !== null) {
      crawlToInitializeContextsMap(current);
      current = current.sibling;
    }
  }

  function getContextChangedKeys(fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        if (idToContextsMap !== null) {
          const id = getFiberIDThrows(fiber);
          const prevContexts = idToContextsMap.has(id)
            ? idToContextsMap.get(id)
            : null;
          const nextContexts = getContextsForFiber(fiber);

          if (prevContexts == null || nextContexts == null) {
            return null;
          }

          const [prevLegacyContext, prevModernContext] = prevContexts;
          const [nextLegacyContext, nextModernContext] = nextContexts;

          if (nextLegacyContext !== NO_CONTEXT) {
            return getChangedKeys(prevLegacyContext, nextLegacyContext);
          } else if (nextModernContext !== NO_CONTEXT) {
            return prevModernContext !== nextModernContext;
          }
        }
        break;
    }
    return null;
  }

  function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) {
      return false;
    }

    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
      if (Object.is(nextDeps[i], prevDeps[i])) {
        continue;
      }
      return false;
    }
    return true;
  }

  function isEffect(memoizedState) {
    if (memoizedState === null || typeof memoizedState !== "object") {
      return false;
    }
    const { deps } = memoizedState;
    const hasOwnProperty = Object.prototype.hasOwnProperty.bind(memoizedState);
    return (
      hasOwnProperty("create") &&
      hasOwnProperty("destroy") &&
      hasOwnProperty("deps") &&
      hasOwnProperty("next") &&
      hasOwnProperty("tag") &&
      (deps === null || Array.isArray(deps))
    );
  }

  function didHookChange(prev, next) {
    const prevMemoizedState = prev.memoizedState;
    const nextMemoizedState = next.memoizedState;

    if (isEffect(prevMemoizedState) && isEffect(nextMemoizedState)) {
      return (
        prevMemoizedState !== nextMemoizedState &&
        !areHookInputsEqual(nextMemoizedState?.deps, prevMemoizedState?.deps)
      );
    }
    return nextMemoizedState !== prevMemoizedState;
  }

  function getChangedHooksIndices(prev, next) {
    if (true) {
      if (prev == null || next == null) {
        return null;
      }

      const indices = [];

      if (
        next.hasOwnProperty("baseState") &&
        next.hasOwnProperty("memoizedState") &&
        next.hasOwnProperty("next") &&
        next.hasOwnProperty("queue")
      ) {
        let index = 0;

        while (next !== null) {
          if (didHookChange(prev, next)) {
            const effect =
              isEffect(prev.memoizedState) && isEffect(next.memoizedState);

            indices.push({
              index,
              prev: {
                ...(!effect
                  ? {
                      value: prev.memoizedState,
                    }
                  : {}),
                dependencies: prev.memoizedState?.deps,
              },
              next: {
                ...(!effect
                  ? {
                      value: next.memoizedState,
                    }
                  : {}),
                dependencies: next.memoizedState?.deps,
              },
            });
          }
          next = next.next;
          prev = prev.next;
          index++;
        }
      }

      return indices;
    }

    return null;
  }

  function getChangedKeys(prev, next) {
    if (prev == null || next == null) {
      return null;
    }

    // We can't report anything meaningful for hooks changes.
    if (
      next.hasOwnProperty("baseState") &&
      next.hasOwnProperty("memoizedState") &&
      next.hasOwnProperty("next") &&
      next.hasOwnProperty("queue")
    ) {
      return null;
    }

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const changedKeys = [];
    for (const key of keys) {
      if (prev[key] !== next[key]) {
        changedKeys.push({
          name: key,
          prev: prev[key],
          next: next[key],
        });
      }
    }

    if (changedKeys.length === 0) {
      return null;
    }

    return changedKeys;
  }

  function didFiberRender(prevFiber, nextFiber) {
    switch (nextFiber.tag) {
      case ClassComponent:
      case FunctionComponent:
      case ContextConsumer:
      case MemoComponent:
      case SimpleMemoComponent:
        // For types that execute user code, we check PerformedWork effect.
        // We don't reflect bailouts (either referential or sCU) in DevTools.
        return (getFiberFlags(nextFiber) & PerformedWork) === PerformedWork;
      // Note: ContextConsumer only gets PerformedWork effect in 16.3.3+
      // so it won't get highlighted with React 16.3.0 to 16.3.2.
      default:
        // For host components and other types, we compare inputs
        // to determine whether something is an update.
        return (
          prevFiber.memoizedProps !== nextFiber.memoizedProps ||
          prevFiber.memoizedState !== nextFiber.memoizedState ||
          prevFiber.ref !== nextFiber.ref
        );
    }
  }

  const pendingOperations = [];
  const pendingRealUnmountedIDs = [];
  const pendingSimulatedUnmountedIDs = [];
  const pendingStringTable = new Map();
  let pendingStringTableLength = 0;
  let pendingUnmountedRootID = null;

  function pushOperation(op) {
    pendingOperations.push(op);
  }

  function flushPendingEvents() {
    const numUnmountIDs =
      pendingRealUnmountedIDs.length +
      pendingSimulatedUnmountedIDs.length +
      (pendingUnmountedRootID === null ? 0 : 1);

    const operations = new Array(
      // Identify which renderer this update is coming from.
      2 + // [rendererID, rootFiberID]
        // How big is the string table?
        1 + // [stringTableLength]
        // Then goes the actual string table.
        pendingStringTableLength +
        // All unmounts are batched in a single message.
        // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
        (numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) +
        // Regular operations
        pendingOperations.length
    );

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber props, states, and hooks to be inspected.
    let i = 0;
    operations[i++] = rendererID;
    operations[i++] = currentRootID;

    // Now fill in the string table.
    // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
    operations[i++] = pendingStringTableLength;
    pendingStringTable.forEach((value, key) => {
      operations[i++] = key.length;
      const encodedKey = utfEncodeString(key);
      for (let j = 0; j < encodedKey.length; j++) {
        operations[i + j] = encodedKey[j];
      }
      i += key.length;
    });

    if (numUnmountIDs > 0) {
      // All unmounts except roots are batched in a single message.
      operations[i++] = TREE_OPERATION_UNMOUNT;
      // The first number is how many unmounted IDs we're gonna send.
      operations[i++] = numUnmountIDs;
      // Fill in the real unmounts in the reverse order.
      // They were inserted parents-first by React, but we want children-first.
      // So we traverse our array backwards.
      for (let j = pendingRealUnmountedIDs.length - 1; j >= 0; j--) {
        operations[i++] = pendingRealUnmountedIDs[j];
      }
      // Fill in the simulated unmounts (hidden Suspense subtrees) in their order.
      // (We want children to go before parents.)
      // They go *after* the real unmounts because we know for sure they won't be
      // children of already pushed "real" IDs. If they were, we wouldn't be able
      // to discover them during the traversal, as they would have been deleted.
      for (let j = 0; j < pendingSimulatedUnmountedIDs.length; j++) {
        operations[i + j] = pendingSimulatedUnmountedIDs[j];
      }
      i += pendingSimulatedUnmountedIDs.length;
      // The root ID should always be unmounted last.
      if (pendingUnmountedRootID !== null) {
        operations[i] = pendingUnmountedRootID;
        i++;
      }
    }
    // Fill in the rest of the operations.
    for (let j = 0; j < pendingOperations.length; j++) {
      operations[i + j] = pendingOperations[j];
    }
    i += pendingOperations.length;

    // Let the frontend know about tree operations.
    hook.emit("operations", operations);

    // Reset all of the pending state now that we've told the frontend about it.
    pendingOperations.length = 0;
    pendingRealUnmountedIDs.length = 0;
    pendingSimulatedUnmountedIDs.length = 0;
    pendingUnmountedRootID = null;
    pendingStringTable.clear();
    pendingStringTableLength = 0;
  }

  function getStringID(str) {
    if (str === null || str === undefined) {
      return 0;
    }
    const existingID = pendingStringTable.get(str);
    if (existingID !== undefined) {
      return existingID;
    }
    const stringID = pendingStringTable.size + 1;
    pendingStringTable.set(str, stringID);
    // The string table total length needs to account
    // both for the string length, and for the array item
    // that contains the length itself. Hence + 1.
    pendingStringTableLength += str.length + 1;
    return stringID;
  }

  function recordMount(fiber, parentFiber) {
    const isRoot = fiber.tag === HostRoot;
    const id = getOrGenerateFiberID(fiber);
    const hasOwnerMetadata = fiber.hasOwnProperty("_debugOwner");
    const isProfilingSupported = fiber.hasOwnProperty("treeBaseDuration");

    if (isRoot) {
      pushOperation(TREE_OPERATION_MOUNT);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation(isProfilingSupported ? 1 : 0);
      pushOperation(hasOwnerMetadata ? 1 : 0);

      if (displayNamesByRootID !== null) {
        displayNamesByRootID.set(id, getDisplayNameForRoot(fiber));
      }
    } else {
      const { key } = fiber;
      const displayName = getDisplayNameForFiber(fiber);
      const elementType = getElementTypeForFiber(fiber);
      const { _debugOwner } = fiber;

      // Ideally we should call getFiberIDThrows() for _debugOwner,
      // since owners are almost always higher in the tree (and so have already been processed),
      // but in some (rare) instances reported in open source, a descendant mounts before an owner.
      // Since this is a DEV only field it's probably okay to also just lazily generate and ID here if needed.
      // See https://github.com/facebook/react/issues/21445
      const ownerID =
        _debugOwner != null ? getOrGenerateFiberID(_debugOwner) : 0;
      const parentID = parentFiber ? getFiberIDThrows(parentFiber) : 0;

      const displayNameStringID = getStringID(displayName);

      // This check is a guard to handle a React element that has been modified
      // in such a way as to bypass the default stringification of the "key" property.
      const keyString = key === null ? null : "" + key;
      const keyStringID = getStringID(keyString);

      pushOperation(TREE_OPERATION_MOUNT);
      pushOperation(id);
      pushOperation(elementType);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID);
    }

    if (isProfilingSupported) {
      idToRootMap.set(id, currentRootID);

      recordProfilingDurations(fiber);
    }
  }

  function recordUnmount(fiber, isSimulated) {
    const unsafeID = getFiberIDUnsafe(fiber);
    if (unsafeID === null) {
      // If we've never seen this Fiber, it might be inside of a legacy render Suspense fragment (so the store is not even aware of it).
      // In that case we can just ignore it or it will cause errors later on.
      // One example of this is a Lazy component that never resolves before being unmounted.
      //
      // This also might indicate a Fast Refresh force-remount scenario.
      //
      // TODO: This is fragile and can obscure actual bugs.
      return;
    }

    // Flow refinement.
    const id = unsafeID;
    const isRoot = fiber.tag === HostRoot;
    if (isRoot) {
      // Roots must be removed only after all children (pending and simulated) have been removed.
      // So we track it separately.
      pendingUnmountedRootID = id;
    } else if (!shouldFilterFiber(fiber)) {
      // To maintain child-first ordering,
      // we'll push it into one of these queues,
      // and later arrange them in the correct order.
      if (isSimulated) {
        pendingSimulatedUnmountedIDs.push(id);
      } else {
        pendingRealUnmountedIDs.push(id);
      }
    }

    if (!fiber._debugNeedsRemount) {
      untrackFiberID(fiber);

      const isProfilingSupported = fiber.hasOwnProperty("treeBaseDuration");
      if (isProfilingSupported) {
        idToRootMap.delete(id);
        idToTreeBaseDurationMap.delete(id);
      }
    }
  }

  function mountFiberRecursively(
    firstChild,
    parentFiber,
    traverseSiblings,
    traceNearestHostComponentUpdate
  ) {
    // Iterate over siblings rather than recursing.
    // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
    let fiber = firstChild;
    while (fiber !== null) {
      // Generate an ID even for filtered Fibers, in case it's needed later (e.g. for Profiling).
      getOrGenerateFiberID(fiber);

      const shouldIncludeInTree = !shouldFilterFiber(fiber);
      if (shouldIncludeInTree) {
        recordMount(fiber, parentFiber);
      }

      const isSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent;
      if (isSuspense) {
        const isTimedOut = fiber.memoizedState !== null;
        if (isTimedOut) {
          // Special case: if Suspense mounts in a timed-out state,
          // get the fallback child from the inner fragment and mount
          // it as if it was our own child. Updates handle this too.
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment
            ? primaryChildFragment.sibling
            : null;
          const fallbackChild = fallbackChildFragment
            ? fallbackChildFragment.child
            : null;
          if (fallbackChild !== null) {
            mountFiberRecursively(
              fallbackChild,
              shouldIncludeInTree ? fiber : parentFiber,
              true,
              traceNearestHostComponentUpdate
            );
          }
        } else {
          let primaryChild = null;
          const areSuspenseChildrenConditionallyWrapped =
            OffscreenComponent === -1;
          if (areSuspenseChildrenConditionallyWrapped) {
            primaryChild = fiber.child;
          } else if (fiber.child !== null) {
            primaryChild = fiber.child.child;
          }
          if (primaryChild !== null) {
            mountFiberRecursively(
              primaryChild,
              shouldIncludeInTree ? fiber : parentFiber,
              true,
              traceNearestHostComponentUpdate
            );
          }
        }
      } else {
        if (fiber.child !== null) {
          mountFiberRecursively(
            fiber.child,
            shouldIncludeInTree ? fiber : parentFiber,
            true,
            traceNearestHostComponentUpdate
          );
        }
      }

      fiber = traverseSiblings ? fiber.sibling : null;
    }
  }

  // We use this to simulate unmounting for Suspense trees
  // when we switch from primary to fallback.
  function unmountFiberChildrenRecursively(fiber) {
    // We might meet a nested Suspense on our way.
    const isTimedOutSuspense =
      fiber.tag === ReactTypeOfWork.SuspenseComponent &&
      fiber.memoizedState !== null;

    let child = fiber.child;
    if (isTimedOutSuspense) {
      // If it's showing fallback tree, let's traverse it instead.
      const primaryChildFragment = fiber.child;
      const fallbackChildFragment = primaryChildFragment
        ? primaryChildFragment.sibling
        : null;
      // Skip over to the real Fiber child.
      child = fallbackChildFragment ? fallbackChildFragment.child : null;
    }

    while (child !== null) {
      // Record simulated unmounts children-first.
      // We skip nodes without return because those are real unmounts.
      if (child.return !== null) {
        unmountFiberChildrenRecursively(child);
        recordUnmount(child, true);
      }
      child = child.sibling;
    }
  }

  function recordProfilingDurations(fiber) {
    const id = getFiberIDThrows(fiber);
    const { actualDuration, treeBaseDuration } = fiber;

    idToTreeBaseDurationMap.set(id, treeBaseDuration || 0);

    const { alternate } = fiber;

    // It's important to update treeBaseDuration even if the current Fiber did not render,
    // because it's possible that one of its descendants did.
    if (alternate == null || treeBaseDuration !== alternate.treeBaseDuration) {
      // Tree base duration updates are included in the operations typed array.
      // So we have to convert them from milliseconds to microseconds so we can send them as ints.
      const convertedTreeBaseDuration = Math.floor(
        (treeBaseDuration || 0) * 1000
      );
      pushOperation(TREE_OPERATION_UPDATE_TREE_BASE_DURATION);
      pushOperation(id);
      pushOperation(convertedTreeBaseDuration);
    }

    if (alternate == null || didFiberRender(alternate, fiber)) {
      if (actualDuration != null) {
        // The actual duration reported by React includes time spent working on children.
        // This is useful information, but it's also useful to be able to exclude child durations.
        // The frontend can't compute this, since the immediate children may have been filtered out.
        // So we need to do this on the backend.
        // Note that this calculated self duration is not the same thing as the base duration.
        // The two are calculated differently (tree duration does not accumulate).
        let selfDuration = actualDuration;
        let child = fiber.child;
        while (child !== null) {
          selfDuration -= child.actualDuration || 0;
          child = child.sibling;
        }

        // If profiling is active, store durations for elements that were rendered during the commit.
        // Note that we should do this for any fiber we performed work on, regardless of its actualDuration value.
        // In some cases actualDuration might be 0 for fibers we worked on (particularly if we're using Date.now)
        // In other cases (e.g. Memo) actualDuration might be greater than 0 even if we "bailed out".
        const metadata = currentCommitProfilingMetadata;
        metadata.durations.push(id, actualDuration, selfDuration);
        metadata.maxActualDuration = Math.max(
          metadata.maxActualDuration,
          actualDuration
        );

        const changeDescription = getChangeDescription(alternate, fiber);
        if (changeDescription !== null) {
          const { didHooksChange, hooks } = changeDescription;
          if (didHooksChange && hooks && hooks.length) {
            const { _debugHookTypes } = getFiberByID(id);

            hooks.forEach(hook => {
              hook.name = _debugHookTypes[hook.index + 1];
            });
          }

          if (metadata.changeDescriptions !== null) {
            metadata.changeDescriptions.set(id, changeDescription);
          }
        }

        updateContextsForFiber(fiber);

        hook.emit("commit", currentCommitProfilingMetadata);
      }
    }
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    nextFiber,
    prevFiber,
    parentFiber,
    traceNearestHostComponentUpdate
  ) {
    const id = getOrGenerateFiberID(nextFiber);

    if (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === id &&
      didFiberRender(prevFiber, nextFiber)
    ) {
      // If this Fiber has updated, clear cached inspected data.
      // If it is inspected again, it may need to be re-run to obtain updated hooks values.
      hasElementUpdatedSinceLastInspected = true;
    }

    const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
    const isSuspense = nextFiber.tag === SuspenseComponent;
    let shouldResetChildren = false;
    // The behavior of timed-out Suspense trees is unique.
    // Rather than unmount the timed out content (and possibly lose important state),
    // React re-parents this content within a hidden Fragment while the fallback is showing.
    // This behavior doesn't need to be observable in the DevTools though.
    // It might even result in a bad user experience for e.g. node selection in the Elements panel.
    // The easiest fix is to strip out the intermediate Fragment fibers,
    // so the Elements panel and Profiler don't need to special case them.
    // Suspense components only have a non-null memoizedState if they're timed-out.
    const prevDidTimeout = isSuspense && prevFiber.memoizedState !== null;
    const nextDidTimeOut = isSuspense && nextFiber.memoizedState !== null;
    // The logic below is inspired by the code paths in updateSuspenseComponent()
    // inside ReactFiberBeginWork in the React source code.
    if (prevDidTimeout && nextDidTimeOut) {
      // Fallback -> Fallback:
      // 1. Reconcile fallback set.
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild
        ? nextFiberChild.sibling
        : null;
      // Note: We can't use nextFiber.child.sibling.alternate
      // because the set is special and alternate may not exist.
      const prevFiberChild = prevFiber.child;
      const prevFallbackChildSet = prevFiberChild
        ? prevFiberChild.sibling
        : null;
      if (
        nextFallbackChildSet != null &&
        prevFallbackChildSet != null &&
        updateFiberRecursively(
          nextFallbackChildSet,
          prevFallbackChildSet,
          nextFiber,
          traceNearestHostComponentUpdate
        )
      ) {
        shouldResetChildren = true;
      }
    } else if (prevDidTimeout && !nextDidTimeOut) {
      // Fallback -> Primary:
      // 1. Unmount fallback set
      // Note: don't emulate fallback unmount because React actually did it.
      // 2. Mount primary set
      const nextPrimaryChildSet = nextFiber.child;
      if (nextPrimaryChildSet !== null) {
        mountFiberRecursively(
          nextPrimaryChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true,
          traceNearestHostComponentUpdate
        );
      }
      shouldResetChildren = true;
    } else if (!prevDidTimeout && nextDidTimeOut) {
      // Primary -> Fallback:
      // 1. Hide primary set
      // This is not a real unmount, so it won't get reported by React.
      // We need to manually walk the previous tree and record unmounts.
      unmountFiberChildrenRecursively(prevFiber);
      // 2. Mount fallback set
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild
        ? nextFiberChild.sibling
        : null;
      if (nextFallbackChildSet != null) {
        mountFiberRecursively(
          nextFallbackChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true,
          traceNearestHostComponentUpdate
        );
        shouldResetChildren = true;
      }
    } else {
      // Common case: Primary -> Primary.
      // This is the same code path as for non-Suspense fibers.
      if (nextFiber.child !== prevFiber.child) {
        // If the first child is different, we need to traverse them.
        // Each next child will be either a new child (mount) or an alternate (update).
        let nextChild = nextFiber.child;
        let prevChildAtSameIndex = prevFiber.child;
        while (nextChild) {
          // We already know children will be referentially different because
          // they are either new mounts or alternates of previous children.
          // Schedule updates and mounts depending on whether alternates exist.
          // We don't track deletions here because they are reported separately.
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;
            if (
              updateFiberRecursively(
                nextChild,
                prevChild,
                shouldIncludeInTree ? nextFiber : parentFiber,
                traceNearestHostComponentUpdate
              )
            ) {
              // If a nested tree child order changed but it can't handle its own
              // child order invalidation (e.g. because it's filtered out like host nodes),
              // propagate the need to reset child order upwards to this Fiber.
              shouldResetChildren = true;
            }
            // However we also keep track if the order of the children matches
            // the previous order. They are always different referentially, but
            // if the instances line up conceptually we'll want to know that.
            if (prevChild !== prevChildAtSameIndex) {
              shouldResetChildren = true;
            }
          } else {
            mountFiberRecursively(
              nextChild,
              shouldIncludeInTree ? nextFiber : parentFiber,
              false,
              traceNearestHostComponentUpdate
            );
            shouldResetChildren = true;
          }
          // Try the next child.
          nextChild = nextChild.sibling;
          // Advance the pointer in the previous list so that we can
          // keep comparing if they line up.
          if (!shouldResetChildren && prevChildAtSameIndex !== null) {
            prevChildAtSameIndex = prevChildAtSameIndex.sibling;
          }
        }
        // If we have no more children, but used to, they don't line up.
        if (prevChildAtSameIndex !== null) {
          shouldResetChildren = true;
        }
      }
    }

    if (shouldIncludeInTree) {
      const isProfilingSupported = nextFiber.hasOwnProperty("treeBaseDuration");
      if (isProfilingSupported) {
        recordProfilingDurations(nextFiber);
      }
    }
    if (shouldResetChildren) {
      // We need to crawl the subtree for closest non-filtered Fibers
      // so that we can display them in a flat children set.
      if (shouldIncludeInTree) {
        // We've handled the child order change for this Fiber.
        // Since it's included, there's no need to invalidate parent child order.
        return false;
      } else {
        // Let the closest unfiltered parent Fiber reset its child order instead.
        return true;
      }
    } else {
      return false;
    }
  }

  function rootSupportsProfiling(root) {
    if (root.memoizedInteractions != null) {
      // v16 builds include this field for the scheduler/tracing API.
      return true;
    } else if (
      root.current != null &&
      root.current.hasOwnProperty("treeBaseDuration")
    ) {
      // The scheduler/tracing API was removed in v17 though
      // so we need to check a non-root Fiber.
      return true;
    } else {
      return false;
    }
  }

  function getUpdatersList(root) {
    return root.memoizedUpdaters != null
      ? Array.from(root.memoizedUpdaters).map(fiberToSerializedElement)
      : null;
  }

  function handleCommitFiberUnmount(fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber, false);
  }

  function handlePostCommitFiberRoot(root) {
    if (rootSupportsProfiling(root)) {
      if (currentCommitProfilingMetadata !== null) {
        const { effectDuration, passiveEffectDuration } =
          getEffectDurations(root);
        currentCommitProfilingMetadata.effectDuration = effectDuration;
        currentCommitProfilingMetadata.passiveEffectDuration =
          passiveEffectDuration;
      }
    }
  }

  function handleCommitFiberRoot(root, priorityLevel) {
    const current = root.current;
    const alternate = current.alternate;

    // Flush any pending Fibers that we are untracking before processing the new commit.
    // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
    untrackFibers();

    currentRootID = getOrGenerateFiberID(current);

    // Handle multi-renderer edge-case where only some v16 renderers support profiling.
    const isProfilingSupported = rootSupportsProfiling(root);

    if (isProfilingSupported) {
      // If profiling is active, store commit time and duration.
      // The frontend may request this information after profiling has stopped.
      currentCommitProfilingMetadata = {
        changeDescriptions: recordChangeDescriptions ? new Map() : null,
        durations: [],
        commitTime: getCurrentTime() - profilingStartTime,
        maxActualDuration: 0,
        priorityLevel:
          priorityLevel == null ? null : formatPriorityLevel(priorityLevel),

        updaters: getUpdatersList(root),

        // Initialize to null; if new enough React version is running,
        // these values will be read during separate handlePostCommitFiberRoot() call.
        effectDuration: null,
        passiveEffectDuration: null,
      };
    }

    if (alternate) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null;
      const isMounted =
        current.memoizedState != null && current.memoizedState.element != null;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        setRootPseudoKey(currentRootID, current);
        mountFiberRecursively(current, null, false, false);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiberRecursively(current, alternate, null, false);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        removeRootPseudoKey(currentRootID);
        recordUnmount(current, false);
      }
    } else {
      // Mount a new root.
      setRootPseudoKey(currentRootID, current);
      mountFiberRecursively(current, null, false, false);
    }

    // We're done here.
    flushPendingEvents(root);

    currentRootID = -1;
  }

  function findAllCurrentHostFibers(id) {
    const fibers = [];
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (!fiber) {
      return fibers;
    }

    // Next we'll drill down this component to find all HostComponent/Text.
    let node = fiber;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        fibers.push(node);
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === fiber) {
        return fibers;
      }
      while (!node.sibling) {
        if (!node.return || node.return === fiber) {
          return fibers;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function findNativeNodesForFiberID(id) {
    try {
      let fiber = findCurrentFiberUsingSlowPathById(id);
      if (fiber === null) {
        return null;
      }
      // Special case for a timed-out Suspense.
      const isTimedOutSuspense =
        fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
      if (isTimedOutSuspense) {
        // A timed-out Suspense's findDOMNode is useless.
        // Try our best to find the fallback directly.
        const maybeFallbackFiber = fiber.child && fiber.child.sibling;
        if (maybeFallbackFiber != null) {
          fiber = maybeFallbackFiber;
        }
      }
      const hostFibers = findAllCurrentHostFibers(id);
      return hostFibers.map(hostFiber => hostFiber.stateNode).filter(Boolean);
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }

  function getDisplayNameForFiberID(id) {
    const fiber = idToArbitraryFiberMap.get(id);
    return fiber != null ? getDisplayNameForFiber(fiber) : null;
  }

  function getFiberByID(id) {
    return idToArbitraryFiberMap.get(id);
  }

  function getFiberIDForNative(
    hostInstance,
    findNearestUnfilteredAncestor = false
  ) {
    let fiber = renderer.findFiberByHostInstance(hostInstance);
    if (fiber != null) {
      if (findNearestUnfilteredAncestor) {
        while (fiber !== null && shouldFilterFiber(fiber)) {
          fiber = fiber.return;
        }
      }
      return getFiberIDThrows(fiber);
    }
    return null;
  }

  const MOUNTING = 1;
  const MOUNTED = 2;
  const UNMOUNTED = 3;

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  function isFiberMountedImpl(fiber) {
    let node = fiber;
    let prevNode = null;
    if (!fiber.alternate) {
      // If there is no alternate, this might be a new tree that isn't inserted
      // yet. If it is, then it will have a pending insertion effect on it.
      if ((getFiberFlags(node) & Placement) !== NoFlags) {
        return MOUNTING;
      }
      // This indicates an error during render.
      if ((getFiberFlags(node) & Incomplete) !== NoFlags) {
        return UNMOUNTED;
      }
      while (node.return) {
        prevNode = node;
        node = node.return;

        if ((getFiberFlags(node) & Placement) !== NoFlags) {
          return MOUNTING;
        }
        // This indicates an error during render.
        if ((getFiberFlags(node) & Incomplete) !== NoFlags) {
          return UNMOUNTED;
        }

        // If this node is inside of a timed out suspense subtree, we should also ignore errors/warnings.
        const isTimedOutSuspense =
          node.tag === SuspenseComponent && node.memoizedState !== null;
        if (isTimedOutSuspense) {
          // Note that this does not include errors/warnings in the Fallback tree though!
          const primaryChildFragment = node.child;
          const fallbackChildFragment = primaryChildFragment
            ? primaryChildFragment.sibling
            : null;
          if (prevNode !== fallbackChildFragment) {
            return UNMOUNTED;
          }
        }
      }
    } else {
      while (node.return) {
        node = node.return;
      }
    }
    if (node.tag === HostRoot) {
      // TODO: Check if this was a nested HostRoot when used with
      // renderContainerIntoSubtree.
      return MOUNTED;
    }
    // If we didn't hit the root, that means that we're in an disconnected tree
    // that has been unmounted.
    return UNMOUNTED;
  }

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  // It would be nice if we updated React to inject this function directly (vs just indirectly via findDOMNode).
  // BEGIN copied code
  function findCurrentFiberUsingSlowPathById(id) {
    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return null;
    }

    const alternate = fiber.alternate;
    if (!alternate) {
      // If there is no alternate, then we only need to check if it is mounted.
      const state = isFiberMountedImpl(fiber);
      if (state === UNMOUNTED) {
        throw Error("Unable to find node on an unmounted component.");
      }
      if (state === MOUNTING) {
        return null;
      }
      return fiber;
    }
    // If we have two possible branches, we'll walk backwards up to the root
    // to see what path the root points to. On the way we may hit one of the
    // special cases and we'll deal with them.
    let a = fiber;
    let b = alternate;
    while (true) {
      const parentA = a.return;
      if (parentA === null) {
        // We're at the root.
        break;
      }
      const parentB = parentA.alternate;
      if (parentB === null) {
        // There is no alternate. This is an unusual case. Currently, it only
        // happens when a Suspense component is hidden. An extra fragment fiber
        // is inserted in between the Suspense fiber and its children. Skip
        // over this extra fragment fiber and proceed to the next parent.
        const nextParent = parentA.return;
        if (nextParent !== null) {
          a = b = nextParent;
          continue;
        }
        // If there's no parent, we're at the root.
        break;
      }

      // If both copies of the parent fiber point to the same child, we can
      // assume that the child is current. This happens when we bailout on low
      // priority: the bailed out fiber's child reuses the current child.
      if (parentA.child === parentB.child) {
        let child = parentA.child;
        while (child) {
          if (child === a) {
            // We've determined that A is the current branch.
            if (isFiberMountedImpl(parentA) !== MOUNTED) {
              throw Error("Unable to find node on an unmounted component.");
            }
            return fiber;
          }
          if (child === b) {
            // We've determined that B is the current branch.
            if (isFiberMountedImpl(parentA) !== MOUNTED) {
              throw Error("Unable to find node on an unmounted component.");
            }
            return alternate;
          }
          child = child.sibling;
        }
        // We should never have an alternate for any mounting node. So the only
        // way this could possibly happen is if this was unmounted, if at all.
        throw Error("Unable to find node on an unmounted component.");
      }

      if (a.return !== b.return) {
        // The return pointer of A and the return pointer of B point to different
        // fibers. We assume that return pointers never criss-cross, so A must
        // belong to the child set of A.return, and B must belong to the child
        // set of B.return.
        a = parentA;
        b = parentB;
      } else {
        // The return pointers point to the same fiber. We'll have to use the
        // default, slow path: scan the child sets of each parent alternate to see
        // which child belongs to which set.
        //
        // Search parent A's child set
        let didFindChild = false;
        let child = parentA.child;
        while (child) {
          if (child === a) {
            didFindChild = true;
            a = parentA;
            b = parentB;
            break;
          }
          if (child === b) {
            didFindChild = true;
            b = parentA;
            a = parentB;
            break;
          }
          child = child.sibling;
        }
        if (!didFindChild) {
          // Search parent B's child set
          child = parentB.child;
          while (child) {
            if (child === a) {
              didFindChild = true;
              a = parentB;
              b = parentA;
              break;
            }
            if (child === b) {
              didFindChild = true;
              b = parentB;
              a = parentA;
              break;
            }
            child = child.sibling;
          }
          if (!didFindChild) {
            throw Error(
              "Child was not found in either parent set. This indicates a bug " +
                "in React related to the return pointer. Please file an issue."
            );
          }
        }
      }

      if (a.alternate !== b) {
        throw Error(
          "Return fibers should always be each others' alternates. " +
            "This error is likely caused by a bug in React. Please file an issue."
        );
      }
    }
    // If the root is not a host container, we're in a disconnected tree. I.e.
    // unmounted.
    if (a.tag !== HostRoot) {
      throw Error("Unable to find node on an unmounted component.");
    }
    if (a.stateNode.current === a) {
      // We've determined that A is the current branch.
      return fiber;
    }
    // Otherwise B has to be current branch.
    return alternate;
  }

  // END copied code

  function fiberToSerializedElement(fiber) {
    return {
      displayName: getDisplayNameForFiber(fiber) || "Anonymous",
      id: getFiberIDThrows(fiber),
      key: fiber.key,
      type: getElementTypeForFiber(fiber),
    };
  }

  function getOwnersList(id) {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const { _debugOwner } = fiber;

    const owners = [fiberToSerializedElement(fiber)];

    if (_debugOwner) {
      let owner = _debugOwner;
      while (owner !== null) {
        owners.unshift(fiberToSerializedElement(owner));
        owner = owner._debugOwner || null;
      }
    }

    return owners;
  }

  function isErrorBoundary(fiber) {
    const { tag, type } = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
        const instance = fiber.stateNode;
        return (
          typeof type.getDerivedStateFromError === "function" ||
          (instance !== null &&
            typeof instance.componentDidCatch === "function")
        );
      default:
        return false;
    }
  }

  function getNearestErrorBoundaryID(fiber) {
    let parent = fiber.return;
    while (parent !== null) {
      if (isErrorBoundary(parent)) {
        return getFiberIDUnsafe(parent);
      }
      parent = parent.return;
    }
    return null;
  }

  function inspectElementRaw(id) {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const {
      _debugOwner,
      _debugSource,
      stateNode,
      key,
      memoizedProps,
      memoizedState,
      dependencies,
      tag,
      type,
    } = fiber;

    const elementType = getElementTypeForFiber(fiber);

    const usesHooks =
      (tag === FunctionComponent ||
        tag === SimpleMemoComponent ||
        tag === ForwardRef) &&
      (!!memoizedState || !!dependencies);

    // TODO Show custom UI for Cache like we do for Suspense
    // For now, just hide state data entirely since it's not meant to be inspected.
    const showState = !usesHooks && tag !== CacheComponent;

    const typeSymbol = getTypeSymbol(type);

    let canViewSource = false;
    let context = null;
    if (
      tag === ClassComponent ||
      tag === FunctionComponent ||
      tag === IncompleteClassComponent ||
      tag === IndeterminateComponent ||
      tag === MemoComponent ||
      tag === ForwardRef ||
      tag === SimpleMemoComponent
    ) {
      canViewSource = true;
      if (stateNode && stateNode.context != null) {
        // Don't show an empty context object for class components that don't use the context API.
        const shouldHideContext =
          elementType === ElementTypeClass &&
          !(type.contextTypes || type.contextType);

        if (!shouldHideContext) {
          context = stateNode.context;
        }
      }
    } else if (
      typeSymbol === CONTEXT_NUMBER ||
      typeSymbol === CONTEXT_SYMBOL_STRING
    ) {
      // 16.3-16.5 read from "type" because the Consumer is the actual context object.
      // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
      // NOTE Keep in sync with getDisplayNameForFiber()
      const consumerResolvedContext = type._context || type;

      // Global context value.
      context = consumerResolvedContext._currentValue || null;

      // Look for overridden value.
      let current = fiber.return;
      while (current !== null) {
        const currentType = current.type;
        const currentTypeSymbol = getTypeSymbol(currentType);
        if (
          currentTypeSymbol === PROVIDER_NUMBER ||
          currentTypeSymbol === PROVIDER_SYMBOL_STRING
        ) {
          // 16.3.0 exposed the context object as "context"
          // PR #12501 changed it to "_context" for 16.3.1+
          // NOTE Keep in sync with getDisplayNameForFiber()
          const providerResolvedContext =
            currentType._context || currentType.context;
          if (providerResolvedContext === consumerResolvedContext) {
            context = current.memoizedProps.value;
            break;
          }
        }

        current = current.return;
      }
    }

    let hasLegacyContext = false;
    if (context !== null) {
      hasLegacyContext = !!type.contextTypes;

      // To simplify hydration and display logic for context, wrap in a value object.
      // Otherwise simple values (e.g. strings, booleans) become harder to handle.
      context = { value: context };
    }

    let owners = null;
    if (_debugOwner) {
      owners = [];
      let owner = _debugOwner;
      while (owner !== null) {
        owners.push(fiberToSerializedElement(owner));
        owner = owner._debugOwner || null;
      }
    }

    const isTimedOutSuspense =
      tag === SuspenseComponent && memoizedState !== null;

    let hooks = null;
    if (usesHooks) {
      const originalConsoleMethods = {};

      // Temporarily disable all console logging before re-running the hook.
      for (const method in console) {
        try {
          originalConsoleMethods[method] = console[method];
          // $FlowFixMe property error|warn is not writable.
          console[method] = () => {};
        } catch (error) {}
      }

      try {
        // hooks = inspectHooksOfFiber(
        //   fiber,
        //   renderer.currentDispatcherRef,
        //   true // Include source location info for hooks
        // );
      } finally {
        // Restore original console functionality.
        for (const method in originalConsoleMethods) {
          try {
            // $FlowFixMe property error|warn is not writable.
            console[method] = originalConsoleMethods[method];
          } catch (error) {}
        }
      }
    }

    let rootType = null;
    let current = fiber;
    while (current.return !== null) {
      current = current.return;
    }
    const fiberRoot = current.stateNode;
    if (fiberRoot != null && fiberRoot._debugRootType !== null) {
      rootType = fiberRoot._debugRootType;
    }

    const errors = fiberIDToErrorsMap.get(id) || new Map();
    const warnings = fiberIDToWarningsMap.get(id) || new Map();

    let targetErrorBoundaryID = getNearestErrorBoundaryID(fiber);

    return {
      id,

      // Does the current renderer support editable hooks and function props?
      canEditHooks: typeof overrideHookState === "function",
      canEditFunctionProps: typeof overrideProps === "function",

      // Does the current renderer support advanced editing interface?
      canEditHooksAndDeletePaths:
        typeof overrideHookStateDeletePath === "function",
      canEditHooksAndRenamePaths:
        typeof overrideHookStateRenamePath === "function",
      canEditFunctionPropsDeletePaths:
        typeof overridePropsDeletePath === "function",
      canEditFunctionPropsRenamePaths:
        typeof overridePropsRenamePath === "function",

      canToggleError: supportsTogglingError && targetErrorBoundaryID != null,
      // Is this error boundary in error state.
      targetErrorBoundaryID,

      canToggleSuspense:
        supportsTogglingSuspense &&
        // If it's showing the real content, we can always flip fallback.
        !isTimedOutSuspense,

      // Can view component source location.
      canViewSource,

      // Does the component have legacy context attached to it.
      hasLegacyContext,

      key: key != null ? key : null,

      displayName: getDisplayNameForFiber(fiber),
      type: elementType,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks,
      props: memoizedProps,
      state: showState ? memoizedState : null,
      errors: Array.from(errors.entries()),
      warnings: Array.from(warnings.entries()),

      // List of owners
      owners,

      // Location of component in source code.
      source: _debugSource || null,

      rootType,
      rendererPackageName: renderer.rendererPackageName,
      rendererVersion: renderer.version,
    };
  }

  let mostRecentlyInspectedElement = null;
  let hasElementUpdatedSinceLastInspected = false;
  let currentlyInspectedPaths = {};

  function isMostRecentlyInspectedElement(id) {
    return (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === id
    );
  }

  // Track the intersection of currently inspected paths,
  // so that we can send their data along if the element is re-rendered.
  function mergeInspectedPaths(path) {
    let current = currentlyInspectedPaths;
    path.forEach(key => {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    });
  }

  function createIsPathAllowed(key, secondaryCategory) {
    // This function helps prevent previously-inspected paths from being dehydrated in updates.
    // This is important to avoid a bad user experience where expanded toggles collapse on update.
    return function isPathAllowed(path) {
      switch (secondaryCategory) {
        case "hooks":
          if (path.length === 1) {
            // Never dehydrate the "hooks" object at the top levels.
            return true;
          }

          if (
            path[path.length - 2] === "hookSource" &&
            path[path.length - 1] === "fileName"
          ) {
            // It's important to preserve the full file name (URL) for hook sources
            // in case the user has enabled the named hooks feature.
            // Otherwise the frontend may end up with a partial URL which it can't load.
            return true;
          }

          if (
            path[path.length - 1] === "subHooks" ||
            path[path.length - 2] === "subHooks"
          ) {
            // Dehydrating the 'subHooks' property makes the HooksTree UI a lot more complicated,
            // so it's easiest for now if we just don't break on this boundary.
            // We can always dehydrate a level deeper (in the value object).
            return true;
          }
          break;
        default:
          break;
      }

      let current =
        key === null ? currentlyInspectedPaths : currentlyInspectedPaths[key];
      if (!current) {
        return false;
      }
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
        if (!current) {
          return false;
        }
      }
      return true;
    };
  }

  function inspectElement(requestID, id, path) {
    if (path !== null) {
      mergeInspectedPaths(path);
    }

    if (isMostRecentlyInspectedElement(id)) {
      if (!hasElementUpdatedSinceLastInspected) {
        if (path !== null) {
          let secondaryCategory = null;
          if (path[0] === "hooks") {
            secondaryCategory = "hooks";
          }

          // If this element has not been updated since it was last inspected,
          // we can just return the subset of data in the newly-inspected path.
          return {
            id,
            responseID: requestID,
            type: "hydrated-path",
            path,
            value: cleanForBridge(
              getInObject(mostRecentlyInspectedElement, path),
              createIsPathAllowed(null, secondaryCategory),
              path
            ),
          };
        } else {
          // If this element has not been updated since it was last inspected, we don't need to return it.
          // Instead we can just return the ID to indicate that it has not changed.
          return {
            id,
            responseID: requestID,
            type: "no-change",
          };
        }
      }
    } else {
      currentlyInspectedPaths = {};
    }

    hasElementUpdatedSinceLastInspected = false;

    mostRecentlyInspectedElement = inspectElementRaw(id);
    if (mostRecentlyInspectedElement === null) {
      return {
        id,
        responseID: requestID,
        type: "not-found",
      };
    }

    // Clone before cleaning so that we preserve the full data.
    // This will enable us to send patches without re-inspecting if hydrated paths are requested.
    // (Reducing how often we shallow-render is a better DX for function components that use hooks.)
    const cleanedInspectedElement = { ...mostRecentlyInspectedElement };
    cleanedInspectedElement.context = cleanForBridge(
      cleanedInspectedElement.context,
      createIsPathAllowed("context", null)
    );
    cleanedInspectedElement.hooks = cleanForBridge(
      cleanedInspectedElement.hooks,
      createIsPathAllowed("hooks", "hooks")
    );
    cleanedInspectedElement.props = cleanForBridge(
      cleanedInspectedElement.props,
      createIsPathAllowed("props", null)
    );
    cleanedInspectedElement.state = cleanForBridge(
      cleanedInspectedElement.state,
      createIsPathAllowed("state", null)
    );

    return {
      id,
      responseID: requestID,
      type: "full-data",
      value: cleanedInspectedElement,
    };
  }

  let currentCommitProfilingMetadata = null;
  let displayNamesByRootID = null;
  let idToContextsMap = null;
  let profilingStartTime = 0;
  let recordChangeDescriptions = true;

  function startProfiling() {
    // Capture initial values as of the time profiling starts.
    // It's important we snapshot both the durations and the id-to-root map,
    // since either of these may change during the profiling session
    // (e.g. when a fiber is re-rendered or when a fiber gets removed).
    displayNamesByRootID = new Map();
    idToContextsMap = new Map();

    hook.getFiberRoots(rendererID).forEach(root => {
      const rootID = getFiberIDThrows(root.current);
      displayNamesByRootID.set(rootID, getDisplayNameForRoot(root.current));

      // Record all contexts at the time profiling is started.
      // Fibers only store the current context value,
      // so we need to track them separately in order to determine changed keys.
      crawlToInitializeContextsMap(root.current);
    });

    profilingStartTime = getCurrentTime();
  }

  // Automatically start profiling so that we don't miss timing info from initial "mount".
  startProfiling(true);

  // Roots don't have a real persistent identity.
  // A root's "pseudo key" is "childDisplayName:indexWithThatName".
  // For example, "App:0" or, in case of similar roots, "Story:0", "Story:1", etc.
  // We will use this to try to disambiguate roots when restoring selection between reloads.
  const rootPseudoKeys = new Map();
  const rootDisplayNameCounter = new Map();

  function setRootPseudoKey(id, fiber) {
    const name = getDisplayNameForRoot(fiber);
    const counter = rootDisplayNameCounter.get(name) || 0;
    rootDisplayNameCounter.set(name, counter + 1);
    const pseudoKey = `${name}:${counter}`;
    rootPseudoKeys.set(id, pseudoKey);
  }

  function removeRootPseudoKey(id) {
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

  function getDisplayNameForRoot(fiber) {
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

  function getPathFrame(fiber) {
    const { key } = fiber;
    let displayName = getDisplayNameForFiber(fiber);
    const index = fiber.index;
    switch (fiber.tag) {
      case HostRoot:
        // Roots don't have a real displayName, index, or key.
        // Instead, we'll use the pseudo key (childDisplayName:indexWithThatName).
        const id = getFiberIDThrows(fiber);
        const pseudoKey = rootPseudoKeys.get(id);
        if (pseudoKey === undefined) {
          throw new Error("Expected mounted root to have known pseudo key.");
        }
        displayName = pseudoKey;
        break;
      case HostComponent:
        displayName = fiber.type;
        break;
      default:
        break;
    }
    return {
      displayName,
      key,
      index,
    };
  }

  // Produces a serializable representation that does a best effort
  // of identifying a particular Fiber between page reloads.
  // The return path will contain Fibers that are "invisible" to the store
  // because their keys and indexes are important to restoring the selection.
  function getPathForElement(id) {
    let fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      return null;
    }
    const keyPath = [];
    while (fiber !== null) {
      keyPath.push(getPathFrame(fiber));
      fiber = fiber.return;
    }
    keyPath.reverse();
    return keyPath;
  }

  const formatPriorityLevel = priorityLevel => {
    if (priorityLevel == null) {
      return "Unknown";
    }

    switch (priorityLevel) {
      case ImmediatePriority:
        return "Immediate";
      case UserBlockingPriority:
        return "User-Blocking";
      case NormalPriority:
        return "Normal";
      case LowPriority:
        return "Low";
      case IdlePriority:
        return "Idle";
      case NoPriority:
      default:
        return "Unknown";
    }
  };

  return {
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    handlePostCommitFiberRoot,

    findNativeNodesForFiberID,
    getDisplayNameForFiberID,
    getFiberIDForNative,
    getOwnersList,
    getPathForElement,
    inspectElement,

    getFiberByID,
  };
}
