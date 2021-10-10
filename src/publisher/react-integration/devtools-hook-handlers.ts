import { separateDisplayNameAndHOCs } from "./utils/separateDisplayNameAndHOCs";
import {
  ElementTypeClass,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeForwardRef,
  ElementTypeProvider,
  ElementTypeConsumer,
  ElementTypeHostRoot,
} from "../../common/constants";
import type { CoreApi } from "./core";
import {
  Fiber,
  MemoizedState,
  TransferFiber,
  TransferFiberChanges,
  TransferContextChange,
  TransferNamedEntryChange,
  FiberRoot,
  ReactDevtoolsHookHandlers,
  RecordEventHandler,
  ReactContext,
  ReactDispatcherTrapApi,
} from "../types";
import { simpleValueSerialization } from "./utils/simpleValueSerialization";
import { objectDiff } from "./utils/objectDiff";
import { arrayDiff } from "./utils/arrayDiff";
import { getDisplayName } from "./utils/getDisplayName";
import { CommitTrigger } from "common-types";

type ContextDescriptor =
  | {
      legacy: false;
      context: ReactContext<any>;
      value: any;
    }
  | {
      legacy: true;
      context: null;
      value: any;
    };
type HookContexts = Map<ReactContext<any>, any>;

function valueDiff(prev: any, next: any) {
  return Array.isArray(prev) ? arrayDiff(prev, next) : objectDiff(prev, next);
}

export function createReactDevtoolsHookHandlers(
  {
    ReactTypeOfWork,
    // ReactPriorityLevels,
    getOrGenerateFiberId,
    getFiberIdThrows,
    getFiberIdUnsafe,
    getFiberOwnerId,
    getFiberById,
    removeFiber,
    getElementTypeForFiber,
    getDisplayNameForFiber,
    setRootPseudoKey,
    didFiberRender,
    removeRootPseudoKey,
    shouldFilterFiber,
  }: CoreApi,
  {
    getHookPath,
    getFiberContexts: getDispatcherFiberContexts,
    flushDispatchCalls,
  }: ReactDispatcherTrapApi,
  recordEvent: RecordEventHandler
): ReactDevtoolsHookHandlers {
  const { HostRoot, SuspenseComponent, OffscreenComponent, ContextProvider } =
    ReactTypeOfWork;
  // const {
  //   ImmediatePriority,
  //   UserBlockingPriority,
  //   NormalPriority,
  //   LowPriority,
  //   IdlePriority,
  //   NoPriority,
  // } = ReactPriorityLevels;

  const idToOwnerId = new Map<number, number>();
  const idToClassContexts = new Map<number, ContextDescriptor>();
  const idToFunctionContexts = new Map<number, HookContexts>();
  const commitUpdatedFiberIds = new Map<number, number | undefined>();
  const commitContext = new Map<
    ReactContext<any>,
    {
      providerId: number;
      value: any;
    }
  >();
  let currentRootId = -1;
  let currentCommitId = -1;
  let commitIdSeed = 0;
  let typeIdSeed = 1;

  const fiberTypeId = new WeakMap<any, number>();
  const fiberTypeIdNonWeakRef = new Map<symbol, Record<string, any>>();
  const unmountedFiberIds = new Set<number>();
  const unmountedFiberIdsByOwnerId = new Map<number, Set<number>>();
  const unmountedFiberIdBeforeSiblingId = new Map<number, number>();
  const unmountedFiberIdForParentId = new Map<number, number>();
  const untrackFibersSet = new Set<Fiber>();
  let untrackFibersTimer: ReturnType<typeof setTimeout> | null = null;

  // Removes a Fiber (and its alternate) from the Maps used to track their id.
  // This method should always be called when a Fiber is unmounting.
  function untrackFiber(fiber: Fiber) {
    // Untrack Fibers after a slight delay in order to support a Fast Refresh edge case:
    // 1. Component type is updated and Fast Refresh schedules an update+remount.
    // 2. flushPendingErrorsAndWarningsAfterDelay() runs, sees the old Fiber is no longer mounted
    //    (it's been disconnected by Fast Refresh), and calls untrackFiber() to clear it from the Map.
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

    if (untrackFibersTimer === null) {
      untrackFibersTimer = setTimeout(untrackFibers, 1000);
    }
  }

  function untrackFibers() {
    if (untrackFibersTimer !== null) {
      clearTimeout(untrackFibersTimer);
      untrackFibersTimer = null;
    }

    for (const fiber of untrackFibersSet) {
      removeFiber(fiber);
    }

    untrackFibersSet.clear();
  }

  function getComponentChange(
    prevFiber: Fiber,
    nextFiber: Fiber
  ): TransferFiberChanges | null {
    const type = getElementTypeForFiber(nextFiber);

    if (
      type !== ElementTypeClass &&
      type !== ElementTypeFunction &&
      type !== ElementTypeMemo &&
      type !== ElementTypeForwardRef &&
      type !== ElementTypeProvider &&
      type !== ElementTypeConsumer
    ) {
      return null;
    }

    const { _debugHookTypes } = nextFiber;
    const isElementTypeClass = prevFiber.stateNode !== null;
    const data: TransferFiberChanges = {
      props: getChangedKeys(prevFiber.memoizedProps, nextFiber.memoizedProps),
      ...(isElementTypeClass
        ? {
            // Class component
            context: getClassContextChangedKeys(nextFiber),
            state: getChangedKeys(
              prevFiber.memoizedState,
              nextFiber.memoizedState
            ),
          }
        : {
            // Functional component
            context: getFunctionContextChangedKeys(nextFiber),
            state: getChangedStateHooks(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
              _debugHookTypes || []
            ),
          }),
    };

    return data;
  }

  function updateContextsForFiber(fiber: Fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass: {
        const id = getFiberIdThrows(fiber);
        const contexts = getContextsForClassFiber(fiber);

        if (contexts !== null) {
          idToClassContexts.set(id, contexts);
        } else {
          idToClassContexts.delete(id);
        }
      }

      case ElementTypeFunction:
      case ElementTypeMemo:
      case ElementTypeForwardRef:
      case ElementTypeProvider:
      case ElementTypeConsumer: {
        const id = getFiberIdThrows(fiber);
        const contexts = getContextsForFunctionFiber(fiber);

        if (contexts !== null) {
          idToFunctionContexts.set(id, contexts);
        } else {
          idToFunctionContexts.delete(id);
        }
      }
    }
  }

  function getContextsForClassFiber(fiber: Fiber): ContextDescriptor | null {
    const instance = fiber.stateNode || null;

    if (instance !== null) {
      if (instance.constructor?.contextType) {
        return {
          legacy: false,
          context: instance.constructor?.contextType,
          value: instance.context,
        };
      } else {
        const legacyContext = instance.context;

        if (legacyContext && Object.keys(legacyContext).length !== 0) {
          return {
            legacy: true,
            context: null,
            value: legacyContext,
          };
        }
      }
    }

    return null;
  }

  function getClassContextChangedKeys(
    fiber: Fiber
  ): TransferContextChange[] | undefined {
    const id = getFiberIdThrows(fiber);
    const prevContext = idToClassContexts.get(id) || null;
    const nextContext = getContextsForClassFiber(fiber);

    if (prevContext !== null && nextContext !== null) {
      const prevValue = prevContext.value;
      const nextValue = nextContext.value;

      if (nextContext.legacy) {
        return getChangedKeys(prevValue, nextValue);
      }

      if (!Object.is(prevValue, nextValue)) {
        return [
          {
            name: getDisplayName(nextContext.context, "Context"),
            providerId: commitContext.get(nextContext.context)?.providerId,
            prev: simpleValueSerialization(prevValue),
            next: simpleValueSerialization(nextValue),
            diff: valueDiff(prevValue, nextValue),
          },
        ];
      }
    }

    return;
  }

  function getContextsForFunctionFiber(fiber: Fiber): HookContexts | null {
    let cursor =
      fiber.dependencies?.firstContext ||
      fiber.contextDependencies?.first ||
      null;

    if (cursor !== null) {
      const contexts = new Map();

      while (cursor !== null) {
        contexts.set(cursor.context, commitContext.get(cursor.context)?.value);

        cursor = cursor.next;
      }

      return contexts;
    }

    return null;
  }

  function getFunctionContextChangedKeys(
    fiber: Fiber
  ): TransferContextChange[] | undefined {
    const id = getFiberIdThrows(fiber);
    const prevContexts = idToFunctionContexts.get(id) || null;
    const nextContexts = getContextsForFunctionFiber(fiber);

    if (prevContexts !== null && nextContexts !== null) {
      const changes = [];

      for (const [context, prevValue] of prevContexts) {
        const nextValue = nextContexts.get(context);

        if (!Object.is(prevValue, nextValue)) {
          changes.push({
            providerId: commitContext.get(context)?.providerId,
            name: getDisplayName(context, "Context"),
            prev: simpleValueSerialization(prevValue),
            next: simpleValueSerialization(nextValue),
            diff: valueDiff(prevValue, nextValue),
          });
        }
      }

      if (changes.length > 0) {
        return changes;
      }
    }

    return;
  }

  function getChangedStateHooks(
    prev: MemoizedState = null,
    next: MemoizedState = null,
    hookNames: string[]
  ): TransferNamedEntryChange[] | undefined {
    if (prev === null || next === null) {
      return;
    }

    const changes = [];
    let index = 0;

    // Contexts are treating aside by "dependencies" property on fiber.
    // useDebugValue hook has no memoizated state. So exclude both of hook types
    // from the list for correct hook state matching.
    hookNames = hookNames.filter(
      name => name !== "useContext" && name !== "useDebugValue"
    );

    while (next !== null) {
      // We only interested in useState/useReducer hooks, since only these
      // hooks can be a trigger for an update. Such hooks have a special
      // signature in the form of the presence of the "queue" property.
      // So filter hooks by this attribute. With hookNames can distinguish
      // these hooks.
      if (next.queue) {
        const prevValue = prev.memoizedState;
        const nextValue = next.memoizedState;

        if (!Object.is(prevValue, nextValue)) {
          changes.push({
            index,
            path: getHookPath(next.queue.dispatch),
            name: hookNames[index],
            prev: simpleValueSerialization(prevValue),
            next: simpleValueSerialization(nextValue),
            diff: valueDiff(prevValue, nextValue),
          });
        }
      }

      next = next.next;
      prev = prev.next;
      index++;
    }

    return changes.length > 0 ? changes : undefined;
  }

  function getChangedKeys(prev: MemoizedState, next: MemoizedState) {
    if (prev == null || next == null) {
      return undefined;
    }

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const changedKeys = [];
    for (const key of keys) {
      if (!Object.is(prev[key], next[key])) {
        changedKeys.push({
          name: key,
          prev: simpleValueSerialization(prev[key]),
          next: simpleValueSerialization(next[key]),
          diff: valueDiff(prev[key], next[key]),
        });
      }
    }

    return changedKeys.length > 0 ? changedKeys : undefined;
  }

  function getFiberContexts(fiber: Fiber, fiberType: number) {
    if (fiber.stateNode !== null) {
      const context = getContextsForClassFiber(fiber);

      if (context === null || context.legacy) {
        return null;
      }

      return [
        {
          providerId: commitContext.get(context.context)?.providerId,
          name: getDisplayName(context.context, "Context"),
        },
      ];
    }

    if (fiberType === ElementTypeConsumer) {
      const context = fiber.type._context;

      return [
        {
          providerId: commitContext.get(context)?.providerId,
          name: getDisplayName(context, "Context"),
        },
      ];
    }

    const fiberContexts = getDispatcherFiberContexts(fiber);

    if (Array.isArray(fiberContexts)) {
      return fiberContexts.map(({ context, reads }) => ({
        providerId: commitContext.get(context)?.providerId,
        name: getDisplayName(context, "Context"),
        reads,
      }));
    }

    return null;
  }

  function getFiberTypeId(type: any): number {
    if (type === null) {
      return 0;
    }

    if (typeof type !== "object" && typeof type !== "function") {
      const replacement = fiberTypeIdNonWeakRef.get(type);

      if (replacement === undefined) {
        fiberTypeIdNonWeakRef.set(type, (type = {}));
      } else {
        type = replacement;
      }
    }

    let typeId = fiberTypeId.get(type);

    if (typeId === undefined) {
      fiberTypeId.set(type, (typeId = typeIdSeed++));
    }

    return typeId;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const fiberId = getOrGenerateFiberId(fiber);
    let transferFiber: TransferFiber;
    let triggerEventId: number | undefined;

    if (isRoot) {
      transferFiber = {
        id: fiberId,
        type: ElementTypeHostRoot,
        typeId: 0,
        key: null,
        ownerId: 0,
        parentId: 0,
        displayName: null,
        hocDisplayNames: null,
        contexts: getFiberContexts(fiber, ElementTypeHostRoot),
      };
    } else {
      const { key, type } = fiber;
      const elementType = getElementTypeForFiber(fiber);
      const parentId = parentFiber ? getFiberIdThrows(parentFiber) : 0;
      const ownerIdCandidate = getFiberOwnerId(fiber);
      const ownerId =
        ownerIdCandidate !== -1 ? ownerIdCandidate : currentRootId;

      const { displayName, hocDisplayNames } = separateDisplayNameAndHOCs(
        getDisplayNameForFiber(fiber),
        elementType
      );

      triggerEventId = commitUpdatedFiberIds.get(ownerId);
      transferFiber = {
        id: fiberId,
        type: elementType,
        typeId: getFiberTypeId(type),
        key: key === null ? null : String(key),
        ownerId,
        parentId,
        displayName,
        hocDisplayNames,
        contexts: getFiberContexts(fiber, elementType),
      };
    }

    idToOwnerId.set(fiberId, transferFiber.ownerId);

    const eventId = recordEvent({
      op: "mount",
      commitId: currentCommitId,
      fiberId,
      fiber: transferFiber,
      ...getDurations(fiber),
      trigger: triggerEventId,
    });

    commitUpdatedFiberIds.set(fiberId, triggerEventId ?? eventId);
    updateContextsForFiber(fiber);
  }

  function recordUnmount(fiberId: number) {
    const ownerId = idToOwnerId.get(fiberId);
    const triggerEventId = commitUpdatedFiberIds.get(ownerId as number);
    const eventId = recordEvent({
      op: "unmount",
      commitId: currentCommitId,
      fiberId,
      trigger: triggerEventId,
    });

    commitUpdatedFiberIds.set(fiberId, triggerEventId ?? eventId);
    idToOwnerId.delete(fiberId);
    idToClassContexts.delete(fiberId);
    idToFunctionContexts.delete(fiberId);

    const fiber = getFiberById(fiberId);
    if (fiber !== null) {
      untrackFiber(fiber);
    }
  }

  function recordSubtreeUnmount(fiberId: number) {
    unmountedFiberIds.delete(fiberId);
    recordUnmount(fiberId);

    const ownerUnmountedFiberIds = unmountedFiberIdsByOwnerId.get(fiberId);
    if (ownerUnmountedFiberIds !== undefined) {
      unmountedFiberIdsByOwnerId.delete(fiberId);

      for (const fiberId of ownerUnmountedFiberIds) {
        recordSubtreeUnmount(fiberId);
      }
    }
  }

  function recordPreviousSiblingUnmount(fiberId: number) {
    const siblingUnmountId = unmountedFiberIdBeforeSiblingId.get(fiberId);

    if (siblingUnmountId !== undefined) {
      recordPreviousSiblingUnmount(siblingUnmountId);
      recordSubtreeUnmount(siblingUnmountId);
    }
  }

  function recordLastChildUnmounts(fiberId: number) {
    const lastChildUnmountId = unmountedFiberIdForParentId.get(fiberId);

    if (lastChildUnmountId !== undefined) {
      recordPreviousSiblingUnmount(lastChildUnmountId);
      recordSubtreeUnmount(lastChildUnmountId);
    }
  }

  function unmountFiber(fiber: Fiber) {
    const id = getFiberIdUnsafe(fiber);

    if (id === null) {
      // If we've never seen this Fiber, it might be inside of a legacy render Suspense fragment (so the store is not even aware of it).
      // In that case we can just ignore it or it will cause errors later on.
      // One example of this is a Lazy component that never resolves before being unmounted.
      //
      // This also might indicate a Fast Refresh force-remount scenario.
      //
      // TODO: This is fragile and can obscure actual bugs.
      return;
    }

    const isRoot = fiber.tag === HostRoot;

    if (isRoot || !shouldFilterFiber(fiber)) {
      if (currentCommitId !== -1) {
        // If unmount occurs in a commit, then record it immediatelly.
        recordSubtreeUnmount(id);
      } else {
        // If an unmount occurs outside of a commit then just remember it not record.
        // React reports about an unmount before a commit, so we will flush
        // events on a commit processing. A various maps are using here to record
        // unmount events in more natural way (since we don't know the right order
        // of events anyway and simulate it on component's tree traversal).
        const ownerId = idToOwnerId.get(id) || 0;
        const siblingId = fiber.sibling
          ? getFiberIdUnsafe(fiber.sibling)
          : null;

        if (siblingId !== null) {
          unmountedFiberIdBeforeSiblingId.set(siblingId, id);
        } else {
          const parentId = fiber.return ? getFiberIdUnsafe(fiber.return) : null;

          if (parentId !== null) {
            unmountedFiberIdForParentId.set(parentId, id);
          }
        }

        if (unmountedFiberIdsByOwnerId.has(ownerId)) {
          unmountedFiberIdsByOwnerId.get(ownerId)?.add(id);
        } else {
          unmountedFiberIdsByOwnerId.set(ownerId, new Set([id]));
        }

        unmountedFiberIds.add(id);
      }
    }

    if (!fiber._debugNeedsRemount) {
      // ???
      // unmountedFiberIds.delete(id);
    }
  }

  function mountFiberRecursively(
    firstChild: Fiber | null,
    parentFiber: Fiber | null,
    traverseSiblings: boolean
  ) {
    // Iterate over siblings rather than recursing.
    // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
    let fiber = firstChild;

    while (fiber !== null) {
      const shouldIncludeInTree = !shouldFilterFiber(fiber);
      const isSuspense = fiber.tag === SuspenseComponent;
      const isProvider = fiber.tag === ContextProvider;
      const context = isProvider ? fiber.type._context : null;
      let prevProviderValue: any;

      // Generate an ID even for filtered Fibers, in case it's needed later (e.g. for Profiling).
      const fiberId = getOrGenerateFiberId(fiber);

      if (context !== null) {
        prevProviderValue = commitContext.get(context);
        commitContext.set(context, {
          providerId: fiberId,
          value: fiber.memoizedProps.value,
        });
      }

      if (shouldIncludeInTree) {
        recordMount(fiber, parentFiber);
      }

      if (isSuspense) {
        const isTimedOut = fiber.memoizedState !== null;

        if (isTimedOut) {
          // Special case: if Suspense mounts in a timed-out state,
          // get the fallback child from the inner fragment and mount
          // it as if it was our own child. Updates handle this too.
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment?.sibling;
          const fallbackChild = fallbackChildFragment?.child || null;

          if (fallbackChild !== null) {
            mountFiberRecursively(
              fallbackChild,
              shouldIncludeInTree ? fiber : parentFiber,
              true
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
              true
            );
          }
        }
      } else {
        if (fiber.child !== null) {
          mountFiberRecursively(
            fiber.child,
            shouldIncludeInTree ? fiber : parentFiber,
            true
          );
        }
      }

      if (context !== null) {
        commitContext.set(context, prevProviderValue);
      }

      fiber = traverseSiblings ? fiber.sibling : null;
    }
  }

  // We use this to simulate unmounting for Suspense trees
  // when we switch from primary to fallback.
  function unmountFiberChildrenRecursively(fiber: Fiber) {
    // We might meet a nested Suspense on our way.
    const isTimedOutSuspense =
      fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
    let child = fiber.child;

    if (isTimedOutSuspense) {
      // If it's showing fallback tree, let's traverse it instead.
      const primaryChildFragment = fiber.child;
      const fallbackChildFragment = primaryChildFragment?.sibling || null;

      // Skip over to the real Fiber child.
      child = fallbackChildFragment?.child || null;
    }

    while (child !== null) {
      // Record simulated unmounts children-first.
      // We skip nodes without return because those are real unmounts.
      if (child.return !== null) {
        unmountFiber(child);
        unmountFiberChildrenRecursively(child);
      }

      child = child.sibling;
    }
  }

  // Calculate fiber durations. Should be called on mount or fiber changes only,
  // otherwise it may return a duration for a previous fiber update.
  function getDurations(fiber: Fiber) {
    const totalTime = fiber.actualDuration ?? 0;
    let selfTime = totalTime;

    // The actual duration reported by React includes time spent working on children.
    // This is useful information, but it's also useful to be able to exclude child durations.
    // The frontend can't compute this, since the immediate children may have been filtered out.
    // So we need to do this on the backend.
    // Note that this calculated self duration is not the same thing as the base duration.
    // The two are calculated differently (tree duration does not accumulate).
    let child = fiber.child;
    while (totalTime > 0 && child !== null) {
      selfTime -= child.actualDuration || 0;
      child = child.sibling;
    }

    return { totalTime, selfTime };
  }

  function recordUpdate(fiber: Fiber) {
    const { alternate = null } = fiber;

    if (alternate !== null && didFiberRender(alternate, fiber)) {
      const fiberId = getFiberIdThrows(fiber);
      const ownerId = getFiberOwnerId(fiber);
      const triggerEventId =
        fiber.memoizedProps !== alternate.memoizedProps
          ? commitUpdatedFiberIds.get(ownerId)
          : undefined;
      const eventId = recordEvent({
        op: "update",
        commitId: currentCommitId,
        fiberId,
        ...getDurations(fiber),
        changes: getComponentChange(alternate, fiber),
        trigger: triggerEventId,
      });

      commitUpdatedFiberIds.set(fiberId, triggerEventId || eventId);
      updateContextsForFiber(fiber);
    }
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    nextFiber: Fiber,
    prevFiber: Fiber,
    parentFiber: Fiber | null
  ) {
    const fiberId = getOrGenerateFiberId(nextFiber);
    const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
    const isSuspense = nextFiber.tag === SuspenseComponent;
    const isProvider = nextFiber.tag === ContextProvider;
    const context = isProvider ? nextFiber.type._context : null;
    let prevProviderValue: any;

    recordPreviousSiblingUnmount(fiberId);

    if (context !== null) {
      prevProviderValue = commitContext.get(context);
      commitContext.set(context, {
        providerId: fiberId,
        value: nextFiber.memoizedProps.value,
      });
    }

    if (shouldIncludeInTree) {
      recordUpdate(nextFiber);
    }

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
      const nextFallbackChildSet = nextFiber.child?.sibling || null;
      // Note: We can't use nextFiber.child.sibling.alternate
      // because the set is special and alternate may not exist.
      const prevFallbackChildSet = prevFiber.child?.sibling || null;

      if (nextFallbackChildSet !== null && prevFallbackChildSet !== null) {
        updateFiberRecursively(
          nextFallbackChildSet,
          prevFallbackChildSet,
          nextFiber
        );
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
          true
        );
      }
    } else if (!prevDidTimeout && nextDidTimeOut) {
      // Primary -> Fallback:
      // 1. Hide primary set
      // This is not a real unmount, so it won't get reported by React.
      // We need to manually walk the previous tree and record unmounts.
      unmountFiberChildrenRecursively(prevFiber);

      // 2. Mount fallback set
      const nextFallbackChildSet = nextFiber.child?.sibling || null;

      if (nextFallbackChildSet !== null) {
        mountFiberRecursively(
          nextFallbackChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true
        );
      }
    } else {
      // Common case: Primary -> Primary.
      // This is the same code path as for non-Suspense fibers.
      if (nextFiber.child !== prevFiber.child) {
        // If the first child is different, we need to traverse them.
        // Each next child will be either a new child (mount) or an alternate (update).
        let nextChild = nextFiber.child;

        while (nextChild) {
          // We already know children will be referentially different because
          // they are either new mounts or alternates of previous children.
          // Schedule updates and mounts depending on whether alternates exist.
          // We don't track deletions here because they are reported separately.
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;

            updateFiberRecursively(
              nextChild,
              prevChild,
              shouldIncludeInTree ? nextFiber : parentFiber
            );
          } else {
            mountFiberRecursively(
              nextChild,
              shouldIncludeInTree ? nextFiber : parentFiber,
              false
            );
          }

          // Try the next child.
          nextChild = nextChild.sibling;
        }
      }
    }

    if (context !== null) {
      commitContext.set(context, prevProviderValue);
    }

    recordLastChildUnmounts(fiberId);
  }

  function recordCommitStart() {
    const dispatchCalls = flushDispatchCalls();
    const triggers: CommitTrigger[] = [];

    for (const call of dispatchCalls) {
      if (call.effectFiber) {
        triggers.push({
          type: "effect",
          fiberId: getOrGenerateFiberId(call.fiber),
          relatedFiberId: getOrGenerateFiberId(call.fiber),
        });
      } else if (call.event) {
        triggers.push({
          type: "event",
          fiberId: getOrGenerateFiberId(call.fiber),
          event: call.event,
        });
      } else if (!call.renderFiber) {
        triggers.push({
          type: "unknown",
          fiberId: getOrGenerateFiberId(call.fiber),
        });
      }
    }

    const eventId = recordEvent({
      op: "commit-start",
      commitId: currentCommitId,
      triggers: [] && triggers, // FIXME: Don't send triggers for now
    });

    commitUpdatedFiberIds.set(currentRootId, eventId);
  }

  function handleCommitFiberUnmount(fiber: Fiber) {
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    unmountFiber(fiber);
  }

  function handlePostCommitFiberRoot(/* root */) {
    // if (rootSupportsProfiling(root)) {
    //   if (currentCommitProfilingMetadata !== null) {
    //     const { effectDuration, passiveEffectDuration } =
    //       getEffectDurations(root);
    //     currentCommitProfilingMetadata.effectDuration = effectDuration;
    //     currentCommitProfilingMetadata.passiveEffectDuration =
    //       passiveEffectDuration;
    //   }
    // }
  }

  function handleCommitFiberRoot(root: FiberRoot /*, priorityLevel?: number*/) {
    const current = root.current;
    const { alternate } = current;

    // Flush any pending Fibers that we are untracking before processing the new commit.
    // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
    untrackFibers();

    currentCommitId = commitIdSeed++;
    currentRootId = getOrGenerateFiberId(current);

    // FIXME: add to commit event
    // console.log(formatPriorityLevel(priorityLevel || -1));

    // Handle multi-renderer edge-case where only some v16 renderers support profiling.
    // const isProfilingSupported = rootSupportsProfiling(root);
    // if (isProfilingSupported) {
    //   // If profiling is active, store commit time and duration.
    //   // The frontend may request this information after profiling has stopped.
    //   currentCommitProfilingMetadata = {
    //     commitTime: getCurrentTime() - profilingStartTime,
    //     priorityLevel:
    //       priorityLevel == null ? null : formatPriorityLevel(priorityLevel),

    //     // Initialize to null; if new enough React version is running,
    //     // these values will be read during separate handlePostCommitFiberRoot() call.
    //     effectDuration: null,
    //     passiveEffectDuration: null,
    //   };
    // }

    // TODO: relying on this seems a bit fishy.
    const wasMounted = Boolean(alternate?.memoizedState?.element);
    const isMounted = Boolean(current.memoizedState?.element);

    recordCommitStart();

    if (!wasMounted && isMounted) {
      // Mount a new root.
      setRootPseudoKey(currentRootId, current);
      mountFiberRecursively(current, null, false);
    } else if (wasMounted && isMounted) {
      // Update an existing root.
      updateFiberRecursively(current, alternate, null);
    } else if (wasMounted && !isMounted) {
      // Unmount an existing root.
      removeRootPseudoKey(currentRootId);
      unmountFiber(current);
    }

    // Normally unmounted fibers should removed on component's tree traversal,
    // but in case it's not then flush what's left
    for (const fiberId of unmountedFiberIds) {
      recordUnmount(fiberId);
    }

    // We're done here
    currentCommitId = -1;
    commitUpdatedFiberIds.clear();
    commitContext.clear();
    unmountedFiberIds.clear();
    unmountedFiberIdsByOwnerId.clear();
    unmountedFiberIdBeforeSiblingId.clear();
    unmountedFiberIdForParentId.clear();
  }

  // function formatPriorityLevel(priorityLevel: number | null = null) {
  //   switch (priorityLevel) {
  //     case ImmediatePriority:
  //       return "Immediate";
  //     case UserBlockingPriority:
  //       return "User-Blocking";
  //     case NormalPriority:
  //       return "Normal";
  //     case LowPriority:
  //       return "Low";
  //     case IdlePriority:
  //       return "Idle";
  //     case NoPriority:
  //     default:
  //       return "Unknown";
  //   }
  // }

  return {
    handleCommitFiberRoot,
    handlePostCommitFiberRoot,
    handleCommitFiberUnmount,
  };
}
