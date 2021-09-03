import { separateDisplayNameAndHOCs } from "./utils/separateDisplayNameAndHOCs";
import { getFiberFlags } from "./utils/getFiberFlags";
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeRoot,
} from "./utils/constants";
import type { createIntegrationCore } from "./core";
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

// Differentiates between a null context value and no context.
const NO_CONTEXT = {};

export function createReactDevtoolsHookHandlers(
  {
    ReactTypeOfSideEffect,
    ReactTypeOfWork,
    ReactPriorityLevels,
    getOrGenerateFiberID,
    getFiberIDThrows,
    getFiberIDUnsafe,
    removeFiber,
    getElementTypeForFiber,
    getDisplayNameForFiber,
    setRootPseudoKey,
    removeRootPseudoKey,
    shouldFilterFiber,
  }: ReturnType<typeof createIntegrationCore>,
  recordEvent: RecordEventHandler
): ReactDevtoolsHookHandlers {
  const { PerformedWork } = ReactTypeOfSideEffect;
  const { HostRoot, SuspenseComponent, OffscreenComponent } = ReactTypeOfWork;
  const {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
    NoPriority,
  } = ReactPriorityLevels;

  // Transfer elements
  const idToRootId = new Map<number, number>();
  const idToContextsMap = new Map();

  const untrackFibersSet = new Set<Fiber>();
  let untrackFibersTimeoutID: ReturnType<typeof setTimeout> | null = null;

  const pendingOperations = [];
  const pendingRealUnmountedIDs: number[] = [];
  const pendingSimulatedUnmountedIDs: number[] = [];
  let pendingUnmountedRootID: number | null = null;

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

  function untrackFibers() {
    if (untrackFibersTimeoutID !== null) {
      clearTimeout(untrackFibersTimeoutID);
      untrackFibersTimeoutID = null;
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
            parentUpdate: false,
            context: null,
            hooks: null,
            props: null,
            state: null,
          } as TransferChangeDescription;
        } else {
          const { _debugHookTypes } = nextFiber;
          const isElementTypeClass = prevFiber.stateNode !== null;
          const data: TransferChangeDescription = {
            isFirstMount: false,
            parentUpdate: false,
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

  function getContextsForFiber(fiber: Fiber) {
    if (getElementTypeForFiber(fiber) !== ElementTypeClass) {
      return null;
    }

    const instance = fiber.stateNode || null;
    let legacyContext = NO_CONTEXT;
    let modernContext = NO_CONTEXT;

    if (instance !== null) {
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
      idToRootId.delete(id);
      recordEvent({
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

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getOrGenerateFiberID(fiber);
    let element: TransferElement;

    if (isRoot) {
      idToRootId.set(id, id);
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
      const { key, _debugOwner = null } = fiber;
      const elementType = getElementTypeForFiber(fiber);
      const displayName = getDisplayNameForFiber(fiber);
      const parentId = parentFiber ? getFiberIDThrows(parentFiber) : 0;
      const rootId = idToRootId.get(parentId) || 0;
      const ownerId =
        _debugOwner === null
          ? rootId
          : // Ideally we should call getFiberIDThrows() for _debugOwner,
            // since owners are almost always higher in the tree (and so have already been processed),
            // but in some (rare) instances reported in open source, a descendant mounts before an owner.
            // Since this is a DEV only field it's probably okay to also just lazily generate and ID here if needed.
            // See https://github.com/facebook/react/issues/21445
            getOrGenerateFiberID(_debugOwner);

      const [displayNameWithoutHOCs, hocDisplayNames] =
        separateDisplayNameAndHOCs(displayName, elementType);

      idToRootId.set(id, rootId);
      element = {
        id,
        type: elementType,
        key: key === null ? null : String(key),
        ownerId,
        parentId,
        displayName: displayNameWithoutHOCs,
        hocDisplayNames,
      };
    }

    recordEvent({
      op: "mount",
      elementId: id,
      element,
      ...getDurations(fiber),
    });

    const isProfilingSupported = fiber.hasOwnProperty("treeBaseDuration");
    if (isProfilingSupported) {
      updateContextsForFiber(fiber);
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
      getOrGenerateFiberID(fiber);

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
        unmountFiberChildrenRecursively(child);
        recordUnmount(child, true);
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
      const changes = getChangeDescription(alternate, fiber);

      recordEvent({
        op: "rerender",
        elementId: getFiberIDThrows(fiber),
        ...getDurations(fiber),
        changes,
      });

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
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber, false);
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

  function handleCommitFiberRoot(root: FiberRoot, priorityLevel?: number) {
    const current = root.current;
    const { alternate } = current;

    // Flush any pending Fibers that we are untracking before processing the new commit.
    // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
    untrackFibers();

    const currentRootID = getOrGenerateFiberID(current);

    // FIXME: add to commit event
    console.log(formatPriorityLevel(priorityLevel || -1));

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
  }

  function formatPriorityLevel(priorityLevel: number | null = null) {
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
  }

  return {
    handleCommitFiberRoot,
    handlePostCommitFiberRoot,
    handleCommitFiberUnmount,
  };
}
