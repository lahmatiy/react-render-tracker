import * as React from "react";
import { getSubscriber } from "rempl";
import { SubscribeMap, useFiberMaps } from "./fiber-maps";
import { subscribeSubtree } from "./tree";
import {
  FiberEvent,
  Message,
  MessageFiber,
  TransferNamedEntryChange,
} from "../types";
import { useDebouncedComputeSubscription } from "./subscription";

interface EventsContext {
  events: Message[];
  loadingStartOffset: number;
  loadedEventsCount: number;
  totalEventsCount: number;
  mountCount: number;
  unmountCount: number;
  updateCount: number;
  clearAllEvents: () => void;
}

const createEventsContextValue = (): EventsContext => ({
  events: [],
  loadingStartOffset: 0,
  loadedEventsCount: 0,
  totalEventsCount: 0,
  mountCount: 0,
  unmountCount: 0,
  updateCount: 0,
  clearAllEvents() {
    /* mock fn */
  },
});
const EventsContext = React.createContext(createEventsContextValue());
export const useEventsContext = () => React.useContext(EventsContext);

export function EventsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState(createEventsContextValue);
  const eventsSince = React.useRef(0);
  const maps = useFiberMaps();
  const {
    fiberById,
    fibersByParentId,
    fibersByOwnerId,
    mountedFibersByParentId,
    mountedFibersByOwnerId,
  } = maps;
  const clearAllEvents = React.useCallback(() => {
    const updates: { map: SubscribeMap<number, any>; id: number }[] = [];

    for (const [id, fiber] of fiberById) {
      if (fiber.events.length > 0) {
        updates.push({ map: fiberById, id });
        fiberById.set(id, {
          ...fiber,
          events: [],
          updatesCount: 0,
          totalTime: 0,
          selfTime: 0,
        });
      }
    }

    for (const [id, children] of fibersByParentId) {
      const mountedChildrenOnly = mountedFibersByParentId.get(id) || [];

      if (children.length !== mountedChildrenOnly.length) {
        updates.push({ map: fibersByParentId, id });
        fibersByParentId.set(id, mountedChildrenOnly);
      }
    }

    for (const [id, children] of fibersByOwnerId) {
      const mountedChildrenOnly = mountedFibersByOwnerId.get(id) || [];

      if (children.length !== mountedChildrenOnly.length) {
        updates.push({ map: fibersByOwnerId, id });
        fibersByOwnerId.set(id, mountedChildrenOnly);
      }
    }

    setState(state => {
      eventsSince.current += state.events.length;

      return {
        ...state,
        events: [],
        loadingStartOffset: 0,
        loadedEventsCount: 0,
        totalEventsCount: state.totalEventsCount - state.events.length,
        mountCount: 0,
        unmountCount: 0,
        updateCount: 0,
      };
    });

    for (const { map, id } of updates) {
      map.notify(id);
    }
  }, [fiberById]);
  const value = React.useMemo(
    () => ({
      ...state,
      clearAllEvents,
    }),
    [state, fiberById]
  );

  React.useEffect(() => {
    const channel = getSubscriber().ns("tree-changes");
    const remoteLoadEvents = channel.getRemoteMethod("getEvents");

    const TROTTLE = false;
    const MAX_EVENT_COUNT = TROTTLE ? 1 : 512;
    let loadingStartOffset = 0;
    let lastLoadedOffset = 0;
    let totalEventsCount = 0;
    let loading = false;

    const finalizeLoading = () => {
      loading = false;
      loadEvents();
    };
    const loadEvents = () => {
      if (loading) {
        return;
      }

      if (lastLoadedOffset < eventsSince.current) {
        loadingStartOffset = eventsSince.current;
        lastLoadedOffset = eventsSince.current;
      }

      if (lastLoadedOffset >= totalEventsCount) {
        loadingStartOffset = totalEventsCount;
        return;
      }

      loading = true;
      remoteLoadEvents(
        lastLoadedOffset,
        Math.min(totalEventsCount - lastLoadedOffset, MAX_EVENT_COUNT),
        (eventsChunk: Message[]) => {
          lastLoadedOffset += eventsChunk.length;

          if (eventsChunk.length > 0) {
            const { mountCount, unmountCount, updateCount } = processEvents(
              eventsChunk,
              maps
            );

            setState(state => {
              state.events.push(...eventsChunk);

              return {
                ...state,
                events: state.events,
                loadedEventsCount: state.loadedEventsCount + eventsChunk.length,
                totalEventsCount: totalEventsCount - eventsSince.current,
                mountCount: state.mountCount + mountCount,
                unmountCount: state.unmountCount + unmountCount,
                updateCount: state.updateCount + updateCount,
              };
            });
          }

          // call load events to make sure there are no more events
          if (TROTTLE) {
            setTimeout(finalizeLoading, 250);
          } else {
            requestAnimationFrame(finalizeLoading);
          }
        }
      );
    };

    return channel.subscribe(data => {
      const { count } = data || { count: 0 };

      if (count !== totalEventsCount) {
        totalEventsCount = count;

        setState(state => ({
          ...state,
          loadingStartOffset: loadingStartOffset - eventsSince.current,
          totalEventsCount: totalEventsCount - eventsSince.current,
        }));

        loadEvents();
      }
    });
  }, [maps]);

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

function upsertFiber(map: Map<number, number[]>, id: number, fiberId: number) {
  if (map.has(id)) {
    map.set(id, (map.get(id) || []).concat(fiberId));
  } else {
    map.set(id, [fiberId]);
  }
}

function removeFiber(map: Map<number, number[]>, id: number, fiberId: number) {
  if (map.has(id)) {
    map.set(
      id,
      (map.get(id) || []).filter(childId => childId !== fiberId)
    );
  }
}

function markUpdated(map: Map<number, number>, id: number, type: number) {
  if (map.has(id)) {
    map.set(id, (map.get(id) || 0) | type);
  } else {
    map.set(id, type);
  }
}

function isShallowEqual(entry: TransferNamedEntryChange) {
  return entry.diff === false;
}

const UPDATE_SELF /*        */ = 0b00000001;
const UPDATE_OWNER /*       */ = 0b00000010;
const UPDATE_PARENT /*      */ = 0b00000100;
const UPDATE_MOUNT_OWNER /* */ = 0b00001000;
const UPDATE_MOUNT_PARENT /**/ = 0b00010000;

export function processEvents(
  events: Message[],
  {
    fiberById,
    fibersByParentId,
    fibersByOwnerId,
    mountedFibersByParentId,
    mountedFibersByOwnerId,
  }: ReturnType<typeof useFiberMaps>
) {
  const updated = new Map<number, number>();
  let mountCount = 0;
  let unmountCount = 0;
  let updateCount = 0;

  for (const event of events) {
    let fiber: MessageFiber;

    switch (event.op) {
      case "mount": {
        mountCount++;
        fiber = {
          ...event.fiber,
          mounted: true,
          events: [],
          updatesCount: 0,
          warnings: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        markUpdated(updated, fiber.parentId, UPDATE_OWNER);
        upsertFiber(fibersByParentId, fiber.parentId, fiber.id);
        markUpdated(updated, fiber.parentId, UPDATE_MOUNT_OWNER);
        upsertFiber(mountedFibersByParentId, fiber.parentId, fiber.id);

        markUpdated(updated, fiber.ownerId, UPDATE_OWNER);
        upsertFiber(fibersByOwnerId, fiber.ownerId, fiber.id);
        markUpdated(updated, fiber.ownerId, UPDATE_MOUNT_OWNER);
        upsertFiber(mountedFibersByOwnerId, fiber.ownerId, fiber.id);
        break;
      }

      case "unmount": {
        unmountCount++;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fiber = fiberById.get(event.fiberId)!;
        fiber = {
          ...fiber,
          mounted: false,
        };

        markUpdated(updated, fiber.ownerId, UPDATE_MOUNT_OWNER);
        removeFiber(mountedFibersByOwnerId, fiber.ownerId, fiber.id);

        markUpdated(updated, fiber.parentId, UPDATE_MOUNT_PARENT);
        removeFiber(mountedFibersByParentId, fiber.parentId, fiber.id);

        break;
      }

      case "update":
        updateCount++;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fiber = fiberById.get(event.fiberId)!;
        fiber = {
          ...fiber,
          updatesCount: fiber.updatesCount + 1,
          selfTime: fiber.selfTime + event.selfTime,
          totalTime: fiber.totalTime + event.totalTime,
          warnings:
            fiber.warnings +
            Number(
              (event.changes?.context
                ? event.changes.context.some(isShallowEqual)
                : false) ||
                (event.changes?.state
                  ? event.changes.state.some(isShallowEqual)
                  : false)
            ),
        };

        break;

      // case "effect-create":
      // case "effect-destroy":
      //   fiber = fiberById.get(event.fiberId)!;
      //   break;

      default:
        continue;
    }

    markUpdated(updated, fiber.id, UPDATE_SELF);
    fiberById.set(event.fiberId, {
      ...fiber,
      events: fiber.events.concat(event),
    });
  }

  // console.log("updated", [...updated], events);
  for (const [id, update] of updated) {
    update & UPDATE_SELF && fiberById.notify(id);
    update & UPDATE_OWNER && fibersByOwnerId.notify(id);
    update & UPDATE_PARENT && fibersByParentId.notify(id);
    update & UPDATE_MOUNT_OWNER && mountedFibersByOwnerId.notify(id);
    update & UPDATE_MOUNT_PARENT && mountedFibersByParentId.notify(id);
  }

  return {
    mountCount,
    unmountCount,
    updateCount,
  };
}

export function useEventLog(
  fiberId: number,
  groupByParent: boolean,
  includeUnmounted: boolean,
  includeSubtree: boolean
) {
  const { fiberById, selectChildrenMap } = useFiberMaps();
  const childrenMap = selectChildrenMap(groupByParent, includeUnmounted);
  const subtree = React.useMemo(
    () => new Map<number, () => void>(),
    [fiberId, includeSubtree, fiberById, childrenMap]
  );

  const compute = React.useCallback((): FiberEvent[] => {
    const events = [];

    for (const id of subtree.keys()) {
      const fiber = fiberById.get(id);

      if (fiber) {
        for (const event of fiber.events) {
          events.push({ fiber, event });
        }
      }
    }

    return events.sort((a, b) => a.event.id - b.event.id);
  }, [subtree, fiberById]);

  const subscribe = React.useCallback(
    requestRecompute => {
      // subtree
      if (includeSubtree) {
        return subscribeSubtree(fiberId, childrenMap, (added, removed) => {
          for (const id of added) {
            if (!subtree.has(id)) {
              subtree.set(id, fiberById.subscribe(id, requestRecompute));
            }
          }

          for (const id of removed) {
            const unsubscribe = subtree.get(id);

            if (typeof unsubscribe === "function") {
              unsubscribe();
              subtree.delete(id);
            }
          }

          requestRecompute();
        });
      }

      // single fiber
      subtree.set(fiberId, fiberById.subscribe(fiberId, requestRecompute));

      return () => {
        const unsubscribe = subtree.get(fiberId);

        if (typeof unsubscribe === "function") {
          unsubscribe(); // unsubscribe
          subtree.delete(fiberId);
        }
      };
    },
    [fiberId, includeSubtree, subtree]
  );

  return useDebouncedComputeSubscription(compute, subscribe, 50);
}
