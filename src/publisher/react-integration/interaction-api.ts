import type { CoreApi } from "./core";
import {
  Fiber,
  ReactInterationApi,
  NativeType,
  SerializedElement,
} from "../types";

export function createReactInteractionApi({
  ReactTypeOfWork,
  getFiberIdThrows,
  getFiberById,
  getElementTypeForFiber,
  getDisplayNameForFiber,
  getRootPseudoKey,
  shouldFilterFiber,
  findFiberByHostInstance,
}: CoreApi): ReactInterationApi {
  const { HostRoot, HostComponent, HostText, SuspenseComponent } =
    ReactTypeOfWork;

  function findAllCurrentHostFibers(id: number) {
    const fibers: Fiber[] = [];
    const fiber = getFiberById(id);

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

  function findNativeNodesForFiberId(id: number) {
    try {
      let fiber = getFiberById(id);

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

  function getDisplayNameForFiberId(id: number) {
    const fiber = getFiberById(id);
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

    return fiber && getFiberIdThrows(fiber);
  }

  function fiberToSerializedElement(fiber: Fiber): SerializedElement {
    return {
      displayName: getDisplayNameForFiber(fiber) || "Anonymous",
      id: getFiberIdThrows(fiber),
      key: fiber.key,
      type: getElementTypeForFiber(fiber),
    };
  }

  function getOwnersList(id: number) {
    const fiber = getFiberById(id);

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
        const id = getFiberIdThrows(fiber);
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
    let fiber = getFiberById(id);

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
    findNativeNodesForFiberId,
    getDisplayNameForFiberId,
    getFiberIdForNative: getFiberIDForNative,
    getOwnersList,
    getPathForElement,
  };
}
