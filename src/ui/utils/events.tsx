import * as React from "react";
import * as ReactDOM from "react-dom";
import { stringifyInfo } from "@discoveryjs/json-ext";
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
  bytesReceived: number;
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
  bytesReceived: 0,
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
  const allFiberEvents = React.useRef<FiberEvent[]>([]).current;
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
          warnings: 0,
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
        bytesReceived: 0,
        mountCount: 0,
        unmountCount: 0,
        updateCount: 0,
      };
    });

    for (const { map, id } of updates) {
      map.notify(id);
    }
  }, [
    fiberById,
    fibersByParentId,
    mountedFibersByParentId,
    fibersByOwnerId,
    mountedFibersByOwnerId,
  ]);
  const value = React.useMemo(
    () => ({
      ...state,
      clearAllEvents,
    }),
    [state, clearAllEvents]
  );

  React.useEffect(() => {
    const channel = getSubscriber().ns("tree-changes");
    const remoteLoadEvents = channel.getRemoteMethod("getEvents");

    channel.onRemoteMethodsChanged(methods => {
      if (methods.includes("getEvents")) {
        loadEvents();
      }
    });

    const TROTTLE = false;
    const MAX_EVENT_COUNT = TROTTLE ? 1 : 512;
    const mapsUpdates = new Map<number, number>();
    let loadingStartOffset = 0;
    let lastLoadedOffset = 0;
    let totalEventsCount = 0;
    let loading = false;

    const finalizeLoading = () => {
      loading = false;
      loadEvents();
    };
    const loadEvents = () => {
      if (loading || !remoteLoadEvents.available) {
        return;
      }

      if (lastLoadedOffset < eventsSince.current) {
        loadingStartOffset = eventsSince.current;
        lastLoadedOffset = eventsSince.current;
      }

      if (lastLoadedOffset >= totalEventsCount) {
        // flush updates async
        setTimeout(() => flushUpdatedMaps(mapsUpdates, maps), 0);
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
            const { minLength: bytesReceived } = stringifyInfo(eventsChunk);
            const { mountCount, unmountCount, updateCount } = processEvents(
              eventsChunk,
              allFiberEvents,
              mapsUpdates,
              maps
            );

            setState(state => {
              state.events.push(...eventsChunk);

              return {
                ...state,
                loadedEventsCount: state.loadedEventsCount + eventsChunk.length,
                totalEventsCount: totalEventsCount - eventsSince.current,
                bytesReceived: state.bytesReceived + bytesReceived,
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

function markUpdated(
  subscribeMap: SubscribeMap<number, any>,
  id: number,
  map: Map<number, number>,
  type: number
) {
  if (subscribeMap.hasSubscriptions(id)) {
    if (map.has(id)) {
      map.set(id, (map.get(id) || 0) | type);
    } else {
      map.set(id, type);
    }
  }
}

function isShallowEqual(entry: TransferNamedEntryChange) {
  return entry.diff === false;
}

const UPDATE_SELF /*               */ = 0b00000001;
const UPDATE_OWNER /*              */ = 0b00000010;
const UPDATE_OWNER_MOUNTED_ONLY /* */ = 0b00000100;
const UPDATE_PARENT /*             */ = 0b00001000;
const UPDATE_PARENT_MOUNTED_ONLY /**/ = 0b00010000;

export function processEvents(
  events: Message[],
  allFiberEvents: FiberEvent[],
  mapsUpdates: Map<number, number>,
  {
    fiberById,
    fibersByParentId,
    fibersByOwnerId,
    mountedFibersByParentId,
    mountedFibersByOwnerId,
  }: ReturnType<typeof useFiberMaps>
) {
  let mountCount = 0;
  let unmountCount = 0;
  let updateCount = 0;

  let fiberEventIndex = allFiberEvents.length;
  allFiberEvents.length += events.length;

  for (const event of events) {
    let fiber: MessageFiber;

    switch (event.op) {
      case "mount": {
        mountCount++;
        fiber = {
          ...event.fiber,
          displayName:
            event.fiber.displayName ||
            (!event.fiber.ownerId ? "Render root" : "Unknown"),
          mounted: true,
          events: [],
          updatesCount: 0,
          warnings: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        markUpdated(
          fibersByParentId,
          fiber.parentId,
          mapsUpdates,
          UPDATE_PARENT
        );
        upsertFiber(fibersByParentId, fiber.parentId, fiber.id);
        markUpdated(
          mountedFibersByParentId,
          fiber.parentId,
          mapsUpdates,
          UPDATE_PARENT_MOUNTED_ONLY
        );
        upsertFiber(mountedFibersByParentId, fiber.parentId, fiber.id);

        markUpdated(fibersByOwnerId, fiber.ownerId, mapsUpdates, UPDATE_OWNER);
        upsertFiber(fibersByOwnerId, fiber.ownerId, fiber.id);
        markUpdated(
          mountedFibersByOwnerId,
          fiber.ownerId,
          mapsUpdates,
          UPDATE_OWNER_MOUNTED_ONLY
        );
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

        markUpdated(
          mountedFibersByOwnerId,
          fiber.ownerId,
          mapsUpdates,
          UPDATE_OWNER_MOUNTED_ONLY
        );
        removeFiber(mountedFibersByOwnerId, fiber.ownerId, fiber.id);

        markUpdated(
          mountedFibersByParentId,
          fiber.parentId,
          mapsUpdates,
          UPDATE_PARENT_MOUNTED_ONLY
        );
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

    const trigger =
      (event.op === "update" &&
        event.trigger !== undefined &&
        allFiberEvents[event.trigger]) ||
      null;
    const fiberEvent: FiberEvent = (allFiberEvents[fiberEventIndex++] = {
      fiberId: event.fiberId,
      event,
      trigger,
      triggeredByOwner: trigger !== null && trigger.fiberId === fiber.ownerId,
    });

    markUpdated(fiberById, fiber.id, mapsUpdates, UPDATE_SELF);
    fiberById.set(event.fiberId, {
      ...fiber,
      events: fiber.events.concat(fiberEvent),
    });
  }

  return {
    mountCount,
    unmountCount,
    updateCount,
  };
}

function flushUpdatedMaps(
  mapsUpdates: Map<number, number>,
  {
    fiberById,
    fibersByParentId,
    fibersByOwnerId,
    mountedFibersByParentId,
    mountedFibersByOwnerId,
  }: ReturnType<typeof useFiberMaps>
) {
  ReactDOM.unstable_batchedUpdates(() => {
    for (const [id, update] of mapsUpdates) {
      update & UPDATE_SELF && fiberById.notify(id);
      update & UPDATE_OWNER && fibersByOwnerId.notify(id);
      update & UPDATE_PARENT && fibersByParentId.notify(id);
      update & UPDATE_OWNER_MOUNTED_ONLY && mountedFibersByOwnerId.notify(id);
      update & UPDATE_PARENT_MOUNTED_ONLY && mountedFibersByParentId.notify(id);
    }

    mapsUpdates.clear();
  });
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
        events.push(...fiber.events);
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
