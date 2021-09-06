import { separateDisplayNameAndHOCs } from "./utils/separateDisplayNameAndHOCs";
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeRoot,
} from "./utils/constants";
import type { CoreApi } from "./core";
import {
  Fiber,
  MemoizedState,
  TransferElement,
  TransferChangeDescription,
  FiberRoot,
  ReactDevtoolsHookHandlers,
  RecordEventHandler,
} from "../types";

const { hasOwnProperty } = Object.prototype;

type ContextDescriptor = {
  legacy: boolean;
  value: any;
};

export function createReactDevtoolsHookHandlers(
  {
    ReactTypeOfWork,
    // ReactPriorityLevels,
    getOrGenerateFiberId,
    getFiberIdThrows,
    getFiberIdUnsafe,
    getFiberOwnerId,
    removeFiber,
    getElementTypeForFiber,
    getDisplayNameForFiber,
    setRootPseudoKey,
    didFiberRender,
    removeRootPseudoKey,
    shouldFilterFiber,
  }: CoreApi,
  recordEvent: RecordEventHandler
): ReactDevtoolsHookHandlers {
  const { HostRoot, SuspenseComponent, OffscreenComponent } = ReactTypeOfWork;
  // const {
  //   ImmediatePriority,
  //   UserBlockingPriority,
  //   NormalPriority,
  //   LowPriority,
  //   IdlePriority,
  //   NoPriority,
  // } = ReactPriorityLevels;

  const idToOwnerId = new Map<number, number>();
  const idToContextsMap = new Map<number, ContextDescriptor>();
  const commitRenderedOwnerIds = new Set<number>();
  let currentRootId = -1;
  let currentCommitId = -1;
  let commitIdSeed = 0;

  const unmountedFibersByOwnerId = new Map<number, Set<Fiber>>();
  const unmountedFiberRootId = new Map<number, number>();
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

  function getChangeDescription(
    prevFiber: Fiber,
    nextFiber: Fiber
  ): TransferChangeDescription | null {
    switch (getElementTypeForFiber(nextFiber)) {
      case ElementTypeClass:
      case ElementTypeFunction:
      case ElementTypeMemo:
      case ElementTypeForwardRef:
        if (prevFiber === null) {
          return {
            isFirstMount: true,
            ownerUpdate: false,
            context: null,
            hooks: null,
            props: null,
            state: null,
          } as TransferChangeDescription;
        } else {
          const { _debugHookTypes } = nextFiber;
          const isElementTypeClass = prevFiber.stateNode !== null;
          const ownerId = idToOwnerId.get(getFiberIdUnsafe(nextFiber) || 0);
          const data: TransferChangeDescription = {
            isFirstMount: false,
            ownerUpdate: commitRenderedOwnerIds.has(ownerId || 0),
            context: isElementTypeClass
              ? getContextChangedKeys(nextFiber)
              : null,
            state: isElementTypeClass
              ? getChangedKeys(prevFiber.memoizedState, nextFiber.memoizedState)
              : null,
            hooks: !isElementTypeClass
              ? getChangedHooks(
                  prevFiber.memoizedState,
                  nextFiber.memoizedState,
                  _debugHookTypes || []
                )
              : null,
            props: getChangedKeys(
              prevFiber.memoizedProps,
              nextFiber.memoizedProps
            ),
          };

          return data;
        }

      default:
        return null;
    }
  }

  function updateContextsForFiber(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) === ElementTypeClass) {
      const id = getFiberIdThrows(fiber);
      const contexts = getContextsForFiber(fiber);

      if (contexts !== null) {
        idToContextsMap.set(id, contexts);
      }
    }
  }

  function getContextsForFiber(fiber: Fiber): ContextDescriptor | null {
    if (getElementTypeForFiber(fiber) !== ElementTypeClass) {
      return null;
    }

    const instance = fiber.stateNode || null;

    if (instance !== null) {
      if (instance.constructor && instance.constructor.contextType != null) {
        return {
          legacy: false,
          value: instance.context,
        };
      } else {
        const legacyContext = instance.context;

        if (legacyContext && Object.keys(legacyContext).length !== 0) {
          return {
            legacy: true,
            value: legacyContext,
          };
        }
      }
    }

    return null;
  }

  function getContextChangedKeys(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) === ElementTypeClass) {
      const id = getFiberIdThrows(fiber);
      const prevContext = idToContextsMap.get(id) || null;
      const nextContext = getContextsForFiber(fiber);

      if (prevContext !== null && nextContext !== null) {
        return nextContext.legacy
          ? getChangedKeys(prevContext.value, nextContext.value)
          : prevContext.value !== nextContext.value;
      }
    }

    return null;
  }

  function isEffect(memoizedState: MemoizedState) {
    if (typeof memoizedState !== "object" || memoizedState === null) {
      return false;
    }

    const { deps } = memoizedState;

    return (
      hasOwnProperty.call(memoizedState, "create") &&
      hasOwnProperty.call(memoizedState, "destroy") &&
      hasOwnProperty.call(memoizedState, "deps") &&
      hasOwnProperty.call(memoizedState, "next") &&
      hasOwnProperty.call(memoizedState, "tag") &&
      (deps === null || Array.isArray(deps))
    );
  }

  function getChangedHooks(
    prev: MemoizedState = null,
    next: MemoizedState = null,
    hookNames: string[]
  ) {
    if (prev === null || next === null) {
      return null;
    }

    const indices = [];
    let index = 0;

    // contexts are treating aside by "dependencies" property on fiber
    hookNames = hookNames.filter(name => name !== "useContext");

    while (next !== null) {
      const effect =
        isEffect(prev.memoizedState) && isEffect(next.memoizedState);
      const changed = prev.memoizedState !== next.memoizedState;

      if (effect) {
        // TODO: use computed in separate changes property
        // const computed =
        // !prev.memoizedState ||
        // getChangedInputsIndecies(
        //   prev.memoizedState.deps,
        //   next.memoizedState.deps
        // );

        if (changed) {
          indices.push({
            index,
            name: hookNames[index],
            prev: simpleValueSerialization(prev.memoizedState),
            next: simpleValueSerialization(next.memoizedState),
          });
        }
      } else if (changed) {
        indices.push({
          index,
          name: hookNames[index],
          prev: simpleValueSerialization(prev.memoizedState),
          next: simpleValueSerialization(next.memoizedState),
        });
      }

      next = next.next;
      prev = prev.next;
      index++;
    }

    return indices.length > 0 ? indices : null;
  }

  function simpleValueSerialization(value: any) {
    switch (typeof value) {
      case "boolean":
      case "undefined":
      case "number":
      case "bigint":
      case "symbol":
        return String(value);

      case "function":
        return "ƒn";

      case "string":
        return value.length > 20 ? value.slice(0, 20) + "…" : value;

      case "object":
        if (value === null) {
          return String(value);
        }

        if (Array.isArray(value)) {
          return value.length ? "[…]" : "[]";
        }

        if (value.constructor === Object) {
          for (const key in value) {
            if (hasOwnProperty.call(value, key)) {
              return "{…}";
            }
          }

          return "{}";
        }

        return Object.prototype.toString.call(value);
    }
  }

  function getChangedKeys(prev: MemoizedState, next: MemoizedState) {
    if (prev == null || next == null) {
      return null;
    }

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const changedKeys = [];
    for (const key of keys) {
      if (!Object.is(prev[key], next[key])) {
        changedKeys.push({
          name: key,
          prev: simpleValueSerialization(prev[key]),
          next: simpleValueSerialization(next[key]),
        });
      }
    }

    return changedKeys.length > 0 ? changedKeys : null;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getOrGenerateFiberId(fiber);
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
    } else {
      const { key } = fiber;
      const elementType = getElementTypeForFiber(fiber);
      const displayName = getDisplayNameForFiber(fiber);
      const parentId = parentFiber ? getFiberIdThrows(parentFiber) : 0;
      const ownerId = getFiberOwnerId(fiber);

      const [displayNameWithoutHOCs, hocDisplayNames] =
        separateDisplayNameAndHOCs(displayName, elementType);

      element = {
        id,
        type: elementType,
        key: key === null ? null : String(key),
        ownerId: ownerId !== -1 ? ownerId : currentRootId,
        parentId,
        displayName: displayNameWithoutHOCs,
        hocDisplayNames,
      };
    }

    idToOwnerId.set(element.id, element.ownerId);
    recordEvent({
      op: "mount",
      commitId: currentCommitId,
      elementId: id,
      element,
      ...getDurations(fiber),
    });

    const isProfilingSupported = fiber.hasOwnProperty("treeBaseDuration");
    if (isProfilingSupported) {
      updateContextsForFiber(fiber);
    }
  }

  function recordUnmount(fiber: Fiber) {
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
      recordEvent({
        op: "unmount",
        commitId: currentCommitId,
        elementId: id,
      });
    }

    if (!fiber._debugNeedsRemount) {
      idToOwnerId.delete(id);
      untrackFiber(fiber);
    }
  }

  function mountFiberRecursively(
    firstChild: Fiber | null,
    parentFiber: Fiber | null,
    traverseSiblings: boolean,
    traceNearestHostComponentUpdate: boolean
  ) {
    // Iterate over siblings rather than recursing.
    // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
    let fiber = firstChild;

    while (fiber !== null) {
      // Generate an ID even for filtered Fibers, in case it's needed later (e.g. for Profiling).
      getOrGenerateFiberId(fiber);

      const shouldIncludeInTree = !shouldFilterFiber(fiber);
      if (shouldIncludeInTree) {
        recordMount(fiber, parentFiber);
      }

      const isSuspense = fiber.tag === SuspenseComponent;
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
      fiber.tag === SuspenseComponent && fiber.memoizedState !== null;

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
        recordUnmount(child);
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

  function recordRerender(fiber: Fiber) {
    const { alternate = null } = fiber;

    if (alternate !== null && didFiberRender(alternate, fiber)) {
      const elementId = getFiberIdThrows(fiber);

      recordEvent({
        op: "rerender",
        commitId: currentCommitId,
        elementId,
        ...getDurations(fiber),
        changes: getChangeDescription(alternate, fiber),
      });

      if (unmountedFibersByOwnerId.has(elementId)) {
        const unmountedFibers = unmountedFibersByOwnerId.get(
          elementId
        ) as Set<Fiber>;

        unmountedFibersByOwnerId.delete(elementId);
        for (const fiber of unmountedFibers) {
          recordUnmount(fiber);
        }
      }

      commitRenderedOwnerIds.add(elementId);
      updateContextsForFiber(fiber);
    }
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    nextFiber: Fiber,
    prevFiber: Fiber,
    parentFiber: Fiber | null,
    traceNearestHostComponentUpdate: boolean
  ) {
    const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
    const isSuspense = nextFiber.tag === SuspenseComponent;

    if (shouldIncludeInTree) {
      recordRerender(nextFiber);
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

      if (nextFallbackChildSet != null && prevFallbackChildSet != null) {
        updateFiberRecursively(
          nextFallbackChildSet,
          prevFallbackChildSet,
          nextFiber,
          traceNearestHostComponentUpdate
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
          true,
          traceNearestHostComponentUpdate
        );
      }
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
              shouldIncludeInTree ? nextFiber : parentFiber,
              traceNearestHostComponentUpdate
            );
          } else {
            mountFiberRecursively(
              nextChild,
              shouldIncludeInTree ? nextFiber : parentFiber,
              false,
              traceNearestHostComponentUpdate
            );
          }

          // Try the next child.
          nextChild = nextChild.sibling;
        }
      }
    }
  }

  function handleCommitFiberUnmount(fiber: Fiber) {
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    // We only remember the unmounted fibers here and flush them on a commit,
    // since React report about an unmount before a commit
    const selfId = getFiberIdUnsafe(fiber) || 0;
    const ownerId = idToOwnerId.get(selfId) || 0;
    const rootId = unmountedFiberRootId.get(ownerId) || ownerId;

    unmountedFiberRootId.set(selfId, rootId);

    if (unmountedFibersByOwnerId.has(rootId)) {
      unmountedFibersByOwnerId.get(rootId)?.add(fiber);
    } else {
      unmountedFibersByOwnerId.set(rootId, new Set([fiber]));
    }
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

    if (!wasMounted && isMounted) {
      // Mount a new root.
      setRootPseudoKey(currentRootId, current);
      mountFiberRecursively(current, null, false, false);
    } else if (wasMounted && isMounted) {
      // Update an existing root.
      updateFiberRecursively(current, alternate, null, false);
    } else if (wasMounted && !isMounted) {
      // Unmount an existing root.
      removeRootPseudoKey(currentRootId);
      recordUnmount(current);
    }

    // Normally unmounted fibers should removed on re-render processing,
    // but in case it's not (e.g. ownerId is not computed right) then flush what's left
    for (const unmountedFibers of unmountedFibersByOwnerId.values()) {
      for (const fiber of unmountedFibers) {
        recordUnmount(fiber);
      }
    }

    // We're done here
    currentCommitId = -1;
    commitRenderedOwnerIds.clear();
    unmountedFibersByOwnerId.clear();
    unmountedFiberRootId.clear();
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
