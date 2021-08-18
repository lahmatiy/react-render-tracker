import {
  getEffectDurations,
  getInternalReactConstants,
  separateDisplayNameAndHOCs,
} from "./utils";
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
} from "../constants.js";
import {
  ReactRenderer,
  Fiber,
  TransferElement,
  ReactChangeDescription,
} from "../types";
import { DevtoolsHook } from "../devtools-hook";
import { Bridge } from "../bridge";
import { TransferChangeDescription } from "../../common/types";

function getFiberFlags(fiber: Fiber): number {
  // The name of this field changed from "effectTag" to "flags"
  return (
    (fiber.flags !== undefined ? fiber.flags : (fiber as any).effectTag) ?? 0
  );
}

const getCurrentTime =
  typeof performance === "object" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

export function attach(
  bridge: Bridge,
  devtoolsHook: DevtoolsHook,
  rendererID: number,
  renderer: ReactRenderer
) {
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

  const {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
    NoPriority,
  } = ReactPriorityLevels;

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

  // Map of one or more Fibers in a pair to their unique id number.
  // We track both Fibers to support Fast Refresh,
  // which may forcefully replace one of the pair as part of hot reloading.
  // In that case it's still important to be able to locate the previous ID during subsequent renders.
  const fiberToIDMap = new Map<Fiber, number>();
  let fiberIdSeed = 0;

  // Map of id to one (arbitrary) Fiber in a pair.
  // This Map is used to e.g. get the display name for a Fiber or schedule an update,
  // operations that should be the same whether the current and work-in-progress Fiber is used.
  const idToArbitraryFiberMap = new Map<number, Fiber>();

  // When profiling is supported, we store the latest tree base durations for each Fiber.
  // This map enables us to filter these times by root when sending them to the frontend.
  const idToRootMap = new Map<number, number>();

  // When a mount or update is in progress, this value tracks the root that is being operated on.
  let currentRootID = -1;

  // Transfer elements
  const idToTransferElement = new Map<number, TransferElement>();
  const mountedElements = new Set<number>();

  // Returns the unique ID for a Fiber or generates and caches a new one if the Fiber hasn't been seen before.
  // Once this method has been called for a Fiber, untrackFiberID() should always be called later to avoid leaking.
  function getOrGenerateFiberID(fiber: Fiber) {
    let id: number | null = null;
    const { alternate } = fiber;

    if (fiberToIDMap.has(fiber)) {
      id = fiberToIDMap.get(fiber);
    } else {
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        id = fiberToIDMap.get(alternate);
      }
    }

    if (id === null) {
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

  // Returns an ID if one has already been generated for the Fiber or null if one has not been generated.
  // Use this method while e.g. logging to avoid over-retaining Fibers.
  function getFiberIDUnsafe(fiber: Fiber) {
    if (fiberToIDMap.has(fiber)) {
      return fiberToIDMap.get(fiber);
    }

    const { alternate } = fiber;
    if (alternate !== null && fiberToIDMap.has(alternate)) {
      return fiberToIDMap.get(alternate);
    }

    return null;
  }

  // Removes a Fiber (and its alternate) from the Maps used to track their id.
  // This method should always be called when a Fiber is unmounting.
  function untrackFiberID(fiber: Fiber) {
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

  const untrackFibersSet = new Set<Fiber>();
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

  function getChangeDescription(
    prevFiber: Fiber,
    nextFiber: Fiber
  ): ReactChangeDescription {
    switch (getElementTypeForFiber(nextFiber)) {
      case ElementTypeClass:
      case ElementTypeFunction:
      case ElementTypeMemo:
      case ElementTypeForwardRef:
        if (prevFiber === null) {
          return {
            isFirstMount: true,
            parentUpdate: false,
            context: null,
            hooks: null,
            props: null,
            state: null,
          } as ReactChangeDescription;
        } else {
          const { _debugHookTypes } = nextFiber;
          const data: ReactChangeDescription = {
            isFirstMount: false,
            parentUpdate: false,
            context: getContextChangedKeys(nextFiber),
            hooks: getChangedHooks(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
              _debugHookTypes
            ),
            props: getChangedKeys(
              prevFiber.memoizedProps,
              nextFiber.memoizedProps
            ),
            state: getChangedKeys(
              prevFiber.memoizedState,
              nextFiber.memoizedState
            ),
          };

          if (!data.hooks && !data.state && !data.props && !data.context) {
            data.parentUpdate = true;
          }

          return data;
        }
      default:
        return null;
    }
  }

  function updateContextsForFiber(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) === ElementTypeClass) {
      const id = getFiberIDThrows(fiber);
      const contexts = getContextsForFiber(fiber);

      if (contexts !== null) {
        idToContextsMap.set(id, contexts);
      }
    }
  }

  // Differentiates between a null context value and no context.
  const NO_CONTEXT = {};

  function getContextsForFiber(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) !== ElementTypeClass) {
      return null;
    }

    const instance = fiber.stateNode;
    let legacyContext = NO_CONTEXT;
    let modernContext = NO_CONTEXT;

    if (instance != null) {
      if (instance.constructor && instance.constructor.contextType != null) {
        modernContext = instance.context;
      } else {
        legacyContext = instance.context;
        if (legacyContext && Object.keys(legacyContext).length === 0) {
          legacyContext = NO_CONTEXT;
        }
      }
    }

    return [legacyContext, modernContext];
  }

  // Record all contexts at the time profiling is started.
  // Fibers only store the current context value,
  // so we need to track them separately in order to determine changed keys.
  function crawlToInitializeContextsMap(fiber: Fiber) {
    updateContextsForFiber(fiber);
    let current = fiber.child;
    while (current !== null) {
      crawlToInitializeContextsMap(current);
      current = current.sibling;
    }
  }

  function getContextChangedKeys(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) === ElementTypeClass) {
      const id = getFiberIDThrows(fiber);
      const prevContexts = idToContextsMap.get(id) || null;
      const nextContexts = getContextsForFiber(fiber);

      if (prevContexts !== null && nextContexts !== null) {
        const [prevLegacyContext, prevModernContext] = prevContexts;
        const [nextLegacyContext, nextModernContext] = nextContexts;

        if (nextLegacyContext !== NO_CONTEXT) {
          return getChangedKeys(prevLegacyContext, nextLegacyContext);
        } else if (nextModernContext !== NO_CONTEXT) {
          return prevModernContext !== nextModernContext;
        }
      }
    }

    return null;
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

  function getChangedInputsIndecies(prevDeps: any[], nextDeps: any[]) {
    if (!Array.isArray(prevDeps) || !Array.isArray(nextDeps)) {
      return false;
    }

    const changes: number[] = [];
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
      if (Object.is(nextDeps[i], prevDeps[i])) {
        changes.push(i);
      }
    }

    return changes.length > 0 ? changes : false;
  }

  function getChangedHooks(prev, next, hookNames) {
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
        const effect =
          isEffect(prev.memoizedState) && isEffect(next.memoizedState);
        const changed = prev.memoizedState !== next.memoizedState;

        if (effect) {
          const computed =
            !prev.memoizedState ||
            getChangedInputsIndecies(
              prev.memoizedState.deps,
              next.memoizedState.deps
            );

          if (computed || changed) {
            indices.push({
              index,
              name: hookNames[index],
              changed,
              computed,
            });
          }
        } else if (changed) {
          indices.push({
            index,
            name: hookNames[index],
            changed,
          });
        }

        next = next.next;
        prev = prev.next;
        index++;
      }
    }

    return indices.length > 0 ? indices : null;
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

    return changedKeys.length > 0 ? changedKeys : null;
  }

  function didFiberRender(prevFiber: Fiber, nextFiber: Fiber) {
    // For types that execute user code, we check PerformedWork effect.
    // For other types compare inputs to determine whether something is an update.
    return (
      (getFiberFlags(nextFiber) & PerformedWork) === PerformedWork ||
      prevFiber.memoizedProps !== nextFiber.memoizedProps ||
      prevFiber.memoizedState !== nextFiber.memoizedState ||
      prevFiber.ref !== nextFiber.ref
    );
  }

  const pendingOperations = [];
  const pendingRealUnmountedIDs = [];
  const pendingSimulatedUnmountedIDs = [];
  let pendingUnmountedRootID = null;

  function flushPendingEvents() {
    const unmountIds = new Set<number>();

    // Fill in the real unmounts in the reverse order.
    // They were inserted parents-first by React, but we want children-first.
    // So we traverse our array backwards.
    for (let j = pendingRealUnmountedIDs.length - 1; j >= 0; j--) {
      unmountIds.add(pendingRealUnmountedIDs[j]);
    }
    // Fill in the simulated unmounts (hidden Suspense subtrees) in their order.
    // (We want children to go before parents.)
    // They go *after* the real unmounts because we know for sure they won't be
    // children of already pushed "real" IDs. If they were, we wouldn't be able
    // to discover them during the traversal, as they would have been deleted.
    for (let j = 0; j < pendingSimulatedUnmountedIDs.length; j++) {
      unmountIds.add(pendingSimulatedUnmountedIDs[j]);
    }

    // The root ID should always be unmounted last.
    if (pendingUnmountedRootID !== null) {
      unmountIds.add(pendingUnmountedRootID);
    }

    for (const id of unmountIds) {
      if (!idToTransferElement.has(id)) {
        throw new Error(
          `Cannot remove node "${id}" because no matching node was found in the Store.`
        );
      }

      idToTransferElement.delete(id);
      bridge.recordEvent({
        op: "unmount",
        elementId: id,
      });
    }

    // Reset all of the pending state now that we've told the frontend about it.
    pendingOperations.length = 0;
    pendingRealUnmountedIDs.length = 0;
    pendingSimulatedUnmountedIDs.length = 0;
    pendingUnmountedRootID = null;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber) {
    const isRoot = fiber.tag === HostRoot;
    const id = getOrGenerateFiberID(fiber);
    const isProfilingSupported = fiber.hasOwnProperty("treeBaseDuration");
    let element: TransferElement;

    if (isRoot) {
      element = {
        id,
        type: ElementTypeRoot,
        key: null,
        ownerId: 0,
        parentId: 0,
        displayName: null,
        hocDisplayNames: null,
      };

      if (displayNamesByRootID !== null) {
        displayNamesByRootID.set(id, getDisplayNameForRoot(fiber));
      }
    } else {
      const { key, _debugOwner } = fiber;
      const displayName = getDisplayNameForFiber(fiber);
      const elementType = getElementTypeForFiber(fiber);

      let ownerId = _debugOwner != null ? getOrGenerateFiberID(_debugOwner) : 0;
      const parentId = parentFiber ? getFiberIDThrows(parentFiber) : 0;

      if (!idToTransferElement.has(parentId)) {
        throw new Error(
          `Cannot add child "${id}" to parent "${parentId}" because parent node was not found in the Store.`
        );
      }

      const parentElement = idToTransferElement.get(parentId);

      if (_debugOwner == null || ownerId === 0) {
        ownerId = parentElement.ownerId || parentElement.id || 0;
      } else {
        // Ideally we should call getFiberIDThrows() for _debugOwner,
        // since owners are almost always higher in the tree (and so have already been processed),
        // but in some (rare) instances reported in open source, a descendant mounts before an owner.
        // Since this is a DEV only field it's probably okay to also just lazily generate and ID here if needed.
        // See https://github.com/facebook/react/issues/21445
        ownerId = getOrGenerateFiberID(_debugOwner);
      }

      const [displayNameWithoutHOCs, hocDisplayNames] =
        separateDisplayNameAndHOCs(displayName, elementType);

      element = {
        id,
        type: elementType,
        key: key === null ? null : "" + key,
        ownerId,
        parentId,
        displayName: displayNameWithoutHOCs,
        hocDisplayNames,
      };
    }

    idToTransferElement.set(id, element);
    mountedElements.add(id);

    if (isProfilingSupported) {
      idToRootMap.set(id, currentRootID);

      recordRender(fiber);
    }
  }

  function recordUnmount(fiber: Fiber, isSimulated: boolean) {
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
      }
    }
  }

  function mountFiberRecursively(
    firstChild: Fiber,
    parentFiber: Fiber,
    traverseSiblings: boolean,
    traceNearestHostComponentUpdate: boolean
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
  function unmountFiberChildrenRecursively(fiber: Fiber) {
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

  /**
   * Fixes possible circular dependencies in component props
   * to allow data serialisation and sending over rempl.
   */
  function parseCommitChanges(entry: ReactChangeDescription) {
    const { props, state } = entry;
    const safeEntry: TransferChangeDescription = {
      ...entry,
      props: null,
      state: null,
    };

    if (props) {
      safeEntry.props = props.map(entry => ({
        name: entry.name,
        changed: entry.prev !== entry.next,
      }));
    }

    if (state) {
      safeEntry.state = state.map(entry => ({
        name: entry.name,
        changed: entry.prev !== entry.next,
      }));
    }

    return safeEntry;
  }

  function recordRender(fiber: Fiber) {
    const id = getFiberIDThrows(fiber);
    const { alternate } = fiber;
    const actualDuration = fiber.actualDuration ?? 0;
    let selfDuration = actualDuration;

    if (alternate == null || didFiberRender(alternate, fiber)) {
      // The actual duration reported by React includes time spent working on children.
      // This is useful information, but it's also useful to be able to exclude child durations.
      // The frontend can't compute this, since the immediate children may have been filtered out.
      // So we need to do this on the backend.
      // Note that this calculated self duration is not the same thing as the base duration.
      // The two are calculated differently (tree duration does not accumulate).
      let child = fiber.child;
      while (child !== null) {
        selfDuration -= child.actualDuration || 0;
        child = child.sibling;
      }

      const changes = getChangeDescription(alternate, fiber);
      bridge.recordEvent({
        op: "render",
        elementId: id,
        initial: !idToTransferElement.has(id),
        actualDuration,
        selfDuration,
        changes: changes && parseCommitChanges(changes),
      });

      updateContextsForFiber(fiber);
    }
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    nextFiber: Fiber,
    prevFiber: Fiber,
    parentFiber: Fiber,
    traceNearestHostComponentUpdate: boolean
  ) {
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
        recordRender(nextFiber);
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
    }

    if (
      root.current != null &&
      root.current.hasOwnProperty("treeBaseDuration")
    ) {
      // The scheduler/tracing API was removed in v17 though
      // so we need to check a non-root Fiber.
      return true;
    }

    return false;
  }

  function handleCommitFiberUnmount(fiber: Fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber, false);
  }

  function handlePostCommitFiberRoot(root: Fiber) {
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

  function handleCommitFiberRoot(root: any, priorityLevel: number) {
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
    flushPendingEvents();
    for (const id of mountedElements) {
      mountedElements.delete(id);
      bridge.recordEvent({
        op: "mount",
        elementId: id,
        element: idToTransferElement.get(id),
      });
    }

    currentRootID = -1;
  }

  function findAllCurrentHostFibers(id: number) {
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

  function findNativeNodesForFiberID(id: number) {
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

  function getDisplayNameForFiberID(id: number) {
    const fiber = idToArbitraryFiberMap.get(id);
    return fiber != null ? getDisplayNameForFiber(fiber) : null;
  }

  function getFiberByID(id: number) {
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
  function isFiberMountedImpl(fiber: Fiber) {
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
  function findCurrentFiberUsingSlowPathById(id: number) {
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

  function fiberToSerializedElement(fiber: Fiber) {
    return {
      displayName: getDisplayNameForFiber(fiber) || "Anonymous",
      id: getFiberIDThrows(fiber),
      key: fiber.key,
      type: getElementTypeForFiber(fiber),
    };
  }

  function getOwnersList(id: number) {
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

  let currentCommitProfilingMetadata = null;
  const displayNamesByRootID = new Map();
  const idToContextsMap = new Map();
  const recordChangeDescriptions = true;

  // Automatically start profiling so that we don't miss timing info from initial "mount".
  devtoolsHook.getFiberRoots(rendererID).forEach(root => {
    const rootID = getFiberIDThrows(root.current);
    displayNamesByRootID.set(rootID, getDisplayNameForRoot(root.current));

    // Record all contexts at the time profiling is started.
    // Fibers only store the current context value,
    // so we need to track them separately in order to determine changed keys.
    crawlToInitializeContextsMap(root.current);
  });

  const profilingStartTime = getCurrentTime();

  // Roots don't have a real persistent identity.
  // A root's "pseudo key" is "childDisplayName:indexWithThatName".
  // For example, "App:0" or, in case of similar roots, "Story:0", "Story:1", etc.
  // We will use this to try to disambiguate roots when restoring selection between reloads.
  const rootPseudoKeys = new Map();
  const rootDisplayNameCounter = new Map();

  function setRootPseudoKey(id: number, fiber: Fiber) {
    const name = getDisplayNameForRoot(fiber);
    const counter = rootDisplayNameCounter.get(name) || 0;
    rootDisplayNameCounter.set(name, counter + 1);
    const pseudoKey = `${name}:${counter}`;
    rootPseudoKeys.set(id, pseudoKey);
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

  function getPathFrame(fiber: Fiber) {
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
  function getPathForElement(id: number) {
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

  const formatPriorityLevel = (priorityLevel: number) => {
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

    getFiberByID,
  };
}
