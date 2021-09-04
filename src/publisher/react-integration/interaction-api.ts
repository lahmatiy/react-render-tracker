import { getFiberFlags } from "./utils/getFiberFlags";
import type { CoreApi } from "./core";
import {
  Fiber,
  ReactInterationApi,
  NativeType,
  SerializedElement,
} from "../types";

const MOUNTING = 1;
const MOUNTED = 2;
const UNMOUNTED = 3;

export function createReactInteractionApi({
  ReactTypeOfSideEffect,
  ReactTypeOfWork,
  getFiberIDThrows,
  getFiberByID,
  getElementTypeForFiber,
  getDisplayNameForFiber,
  getRootPseudoKey,
  shouldFilterFiber,
  findFiberByHostInstance,
}: CoreApi): ReactInterationApi {
  const { Incomplete, NoFlags, Placement } = ReactTypeOfSideEffect;
  const { HostRoot, HostComponent, HostText, SuspenseComponent } =
    ReactTypeOfWork;

  function findAllCurrentHostFibers(id: number) {
    const fibers: Fiber[] = [];
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
    const fiber = getFiberByID(id);
    return fiber !== null ? getDisplayNameForFiber(fiber) : null;
  }

  function getFiberIDForNative(
    hostInstance: NativeType,
    findNearestUnfilteredAncestor = false
  ) {
    let fiber = findFiberByHostInstance(hostInstance);

    if (fiber === null) {
      return null;
    }

    if (findNearestUnfilteredAncestor) {
      while (fiber !== null && shouldFilterFiber(fiber)) {
        fiber = fiber.return;
      }
    }

    return fiber && getFiberIDThrows(fiber);
  }

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
    const fiber = getFiberByID(id);

    if (fiber === null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return null;
    }

    const { alternate } = fiber;
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

  function fiberToSerializedElement(fiber: Fiber): SerializedElement {
    return {
      displayName: getDisplayNameForFiber(fiber) || "Anonymous",
      id: getFiberIDThrows(fiber),
      key: fiber.key,
      type: getElementTypeForFiber(fiber),
    };
  }

  function getOwnersList(id: number) {
    const fiber = findCurrentFiberUsingSlowPathById(id);

    if (fiber === null) {
      return null;
    }

    const { _debugOwner = null } = fiber;
    const owners = [fiberToSerializedElement(fiber)];

    if (_debugOwner) {
      let owner: Fiber | null = _debugOwner;
      while (owner !== null) {
        owners.unshift(fiberToSerializedElement(owner));
        owner = owner._debugOwner || null;
      }
    }

    return owners;
  }

  function getPathFrame(fiber: Fiber) {
    const { key } = fiber;
    const index = fiber.index;
    let displayName = getDisplayNameForFiber(fiber);

    switch (fiber.tag) {
      case HostRoot:
        // Roots don't have a real displayName, index, or key.
        // Instead, we'll use the pseudo key (childDisplayName:indexWithThatName).
        const id = getFiberIDThrows(fiber);
        const pseudoKey = getRootPseudoKey(id);

        if (pseudoKey === null) {
          throw new Error("Expected mounted root to have known pseudo key.");
        }

        displayName = pseudoKey;
        break;
      case HostComponent:
        displayName = fiber.type;
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
    let fiber = getFiberByID(id);

    if (fiber === null) {
      return null;
    }

    const keyPath = [];
    while (fiber !== null) {
      keyPath.push(getPathFrame(fiber));
      fiber = fiber.return;
    }

    return keyPath.reverse();
  }

  return {
    findNativeNodesForFiberID,
    getDisplayNameForFiberID,
    getFiberIDForNative,
    getOwnersList,
    getPathForElement,
  };
}
