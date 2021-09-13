import * as React from "react";
import { getSubscriber } from "rempl";
import { SubscribeMap, useComponentMaps } from "./component-maps";
import { subscribeSubtree } from "./tree";
import { ElementEvent, Message, MessageFiber } from "../types";
import { useDebouncedComputeSubscription } from "./subscription";

interface EventsContext {
  events: Message[];
  loadingStartOffset: number;
  loadedEventsCount: number;
  totalEventsCount: number;
  mountCount: number;
  unmountCount: number;
  rerenderCount: number;
  clearAllEvents: () => void;
}

const createEventsContextValue = (): EventsContext => ({
  events: [],
  loadingStartOffset: 0,
  loadedEventsCount: 0,
  totalEventsCount: 0,
  mountCount: 0,
  unmountCount: 0,
  rerenderCount: 0,
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
  const maps = useComponentMaps();
  const {
    componentById,
    componentsByParentId,
    componentsByOwnerId,
    mountedComponentsByParentId,
    mountedComponentsByOwnerId,
  } = maps;
  const clearAllEvents = React.useCallback(() => {
    const updates: { map: SubscribeMap<number, any>; id: number }[] = [];

    for (const [id, component] of componentById) {
      if (component.events.length > 0) {
        updates.push({ map: componentById, id });
        componentById.set(id, {
          ...component,
          events: [],
          rerendersCount: 0,
          totalTime: 0,
          selfTime: 0,
        });
      }
    }

    for (const [id, children] of componentsByParentId) {
      const mountedChildrenOnly = mountedComponentsByParentId.get(id) || [];

      if (children.length !== mountedChildrenOnly.length) {
        updates.push({ map: componentsByParentId, id });
        componentsByParentId.set(id, mountedChildrenOnly);
      }
    }

    for (const [id, children] of componentsByOwnerId) {
      const mountedChildrenOnly = mountedComponentsByOwnerId.get(id) || [];

      if (children.length !== mountedChildrenOnly.length) {
        updates.push({ map: componentsByOwnerId, id });
        componentsByOwnerId.set(id, mountedChildrenOnly);
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
        rerenderCount: 0,
      };
    });

    for (const { map, id } of updates) {
      map.notify(id);
    }
  }, [componentById]);
  const value = React.useMemo(
    () => ({
      ...state,
      clearAllEvents,
    }),
    [state, componentById]
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
            const { mountCount, unmountCount, rerenderCount } = processEvents(
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
                rerenderCount: state.rerenderCount + rerenderCount,
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

function upsertComponent(
  map: Map<number, number[]>,
  id: number,
  fiberId: number
) {
  if (map.has(id)) {
    map.set(id, (map.get(id) || []).concat(fiberId));
  } else {
    map.set(id, [fiberId]);
  }
}

function removeComponent(
  map: Map<number, number[]>,
  id: number,
  fiberId: number
) {
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

const UPDATE_SELF /*        */ = 0b00000001;
const UPDATE_OWNER /*       */ = 0b00000010;
const UPDATE_PARENT /*      */ = 0b00000100;
const UPDATE_MOUNT_OWNER /* */ = 0b00001000;
const UPDATE_MOUNT_PARENT /**/ = 0b00010000;

export function processEvents(
  events: Message[],
  {
    componentById,
    componentsByParentId,
    componentsByOwnerId,
    mountedComponentsByParentId,
    mountedComponentsByOwnerId,
  }: ReturnType<typeof useComponentMaps>
) {
  const updated = new Map<number, number>();
  let mountCount = 0;
  let unmountCount = 0;
  let rerenderCount = 0;

  for (const event of events) {
    let fiber: MessageFiber;

    switch (event.op) {
      case "mount": {
        mountCount++;
        fiber = {
          ...event.fiber,
          mounted: true,
          events: [],
          rerendersCount: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        markUpdated(updated, fiber.parentId, UPDATE_OWNER);
        upsertComponent(componentsByParentId, fiber.parentId, fiber.id);
        markUpdated(updated, fiber.parentId, UPDATE_MOUNT_OWNER);
        upsertComponent(mountedComponentsByParentId, fiber.parentId, fiber.id);

        markUpdated(updated, fiber.ownerId, UPDATE_OWNER);
        upsertComponent(componentsByOwnerId, fiber.ownerId, fiber.id);
        markUpdated(updated, fiber.ownerId, UPDATE_MOUNT_OWNER);
        upsertComponent(mountedComponentsByOwnerId, fiber.ownerId, fiber.id);
        break;
      }

      case "unmount": {
        unmountCount++;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fiber = componentById.get(event.fiberId)!;
        fiber = {
          ...fiber,
          mounted: false,
        };

        markUpdated(updated, fiber.ownerId, UPDATE_MOUNT_OWNER);
        removeComponent(mountedComponentsByOwnerId, fiber.ownerId, fiber.id);

        markUpdated(updated, fiber.parentId, UPDATE_MOUNT_PARENT);
        removeComponent(mountedComponentsByParentId, fiber.parentId, fiber.id);

        break;
      }

      case "update":
        rerenderCount++;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fiber = componentById.get(event.fiberId)!;
        fiber = {
          ...fiber,
          rerendersCount: fiber.rerendersCount + 1,
          selfTime: fiber.selfTime + event.selfTime,
          totalTime: fiber.totalTime + event.totalTime,
        };

        break;
    }

    markUpdated(updated, fiber.id, UPDATE_SELF);
    componentById.set(event.fiberId, {
      ...fiber,
      events: fiber.events.concat(event),
    });
  }

  // console.log("updated", [...updated], events);
  for (const [id, update] of updated) {
    update & UPDATE_SELF && componentById.notify(id);
    update & UPDATE_OWNER && componentsByOwnerId.notify(id);
    update & UPDATE_PARENT && componentsByParentId.notify(id);
    update & UPDATE_MOUNT_OWNER && mountedComponentsByOwnerId.notify(id);
    update & UPDATE_MOUNT_PARENT && mountedComponentsByParentId.notify(id);
  }

  return {
    mountCount,
    unmountCount,
    rerenderCount,
  };
}

export function useEventLog(
  fiberId: number,
  groupByParent: boolean,
  includeUnmounted: boolean,
  includeSubtree: boolean
) {
  const { componentById, selectChildrenMap } = useComponentMaps();
  const childrenMap = selectChildrenMap(groupByParent, includeUnmounted);
  const subtree = React.useMemo(
    () => new Map<number, () => void>(),
    [fiberId, includeSubtree, componentById, childrenMap]
  );

  const compute = React.useCallback((): ElementEvent[] => {
    const events = [];

    for (const id of subtree.keys()) {
      const component = componentById.get(id);

      if (component) {
        for (const event of component.events) {
          events.push({ component, event });
        }
      }
    }

    return events.sort((a, b) => a.event.id - b.event.id);
  }, [subtree, componentById]);

  const subscribe = React.useCallback(
    requestRecompute => {
      // subtree
      if (includeSubtree) {
        return subscribeSubtree(fiberId, childrenMap, (added, removed) => {
          for (const id of added) {
            if (!subtree.has(id)) {
              subtree.set(id, componentById.subscribe(id, requestRecompute));
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

      // single component
      subtree.set(fiberId, componentById.subscribe(fiberId, requestRecompute));

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
