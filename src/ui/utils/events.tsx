import * as React from "react";
import { getSubscriber } from "rempl";
import { useComponentMaps } from "./component-maps";
import { subscribeSubtree } from "./tree";
import { ElementEvent, Message, MessageElement } from "../types";
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

export function EventsContextProvider({ children }: { children: JSX.Element }) {
  const [state, setState] = React.useState(createEventsContextValue);
  const eventsSince = React.useRef(0);
  const maps = useComponentMaps();
  const { componentById } = maps;
  const clearAllEvents = React.useCallback(() => {
    for (const [id, component] of componentById) {
      componentById.set(id, {
        ...component,
        events: [],
        rerendersCount: 0,
        totalTime: 0,
        selfTime: 0,
      });
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

    for (const id of componentById.keys()) {
      componentById.notify(id);
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

    return channel.subscribe((data: { count: number } | null) => {
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
  componentId: number
) {
  if (map.has(id)) {
    map.set(id, map.get(id).concat(componentId));
  } else {
    map.set(id, [componentId]);
  }
}

function removeComponent(
  map: Map<number, number[]>,
  id: number,
  componentId: number
) {
  if (map.has(id)) {
    const list = map.get(id);
    const idx = list.indexOf(componentId);
    list.splice(idx, 1);
  }
}

function markUpdated(map: Map<number, number>, id: number, type: number) {
  if (map.has(id)) {
    map.set(id, map.get(id) | type);
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
    let element: MessageElement;

    switch (event.op) {
      case "mount": {
        mountCount++;
        element = {
          ...event.element,
          mounted: true,
          events: [],
          rerendersCount: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        markUpdated(updated, element.parentId, UPDATE_OWNER);
        upsertComponent(componentsByParentId, element.parentId, element.id);
        markUpdated(updated, element.parentId, UPDATE_MOUNT_OWNER);
        upsertComponent(
          mountedComponentsByParentId,
          element.parentId,
          element.id
        );

        markUpdated(updated, element.ownerId, UPDATE_OWNER);
        upsertComponent(componentsByOwnerId, element.ownerId, element.id);
        markUpdated(updated, element.ownerId, UPDATE_MOUNT_OWNER);
        upsertComponent(
          mountedComponentsByOwnerId,
          element.ownerId,
          element.id
        );
        break;
      }

      case "unmount": {
        unmountCount++;
        element = {
          ...componentById.get(event.elementId),
          mounted: false,
        };

        markUpdated(updated, element.ownerId, UPDATE_MOUNT_OWNER);
        removeComponent(
          mountedComponentsByOwnerId,
          element.ownerId,
          element.id
        );

        markUpdated(updated, element.parentId, UPDATE_MOUNT_PARENT);
        removeComponent(
          mountedComponentsByParentId,
          element.parentId,
          element.id
        );

        break;
      }

      case "rerender":
        rerenderCount++;
        element = componentById.get(event.elementId);
        element = {
          ...element,
          rerendersCount: element.rerendersCount + 1,
          selfTime: element.selfTime + event.selfTime,
          totalTime: element.totalTime + event.totalTime,
        };

        break;
    }

    markUpdated(updated, element.id, UPDATE_SELF);
    componentById.set(event.elementId, {
      ...element,
      events: element.events.concat(event),
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
  componentId: number,
  groupByParent: boolean,
  includeUnmounted: boolean,
  includeSubtree: boolean
) {
  const { componentById, selectChildrenMap } = useComponentMaps();
  const childrenMap = selectChildrenMap(groupByParent, includeUnmounted);
  const subtree = React.useMemo(
    () => new Map<number, () => void>(),
    [componentId, includeSubtree, componentById, childrenMap]
  );

  const compute = React.useCallback((): ElementEvent[] => {
    const events = [];

    for (const id of subtree.keys()) {
      const component = componentById.get(id);

      for (const event of component.events) {
        events.push({ component, event });
      }
    }

    return events.sort((a, b) => a.event.id - b.event.id);
  }, [subtree, componentById]);

  const subscribe = React.useCallback(
    requestRecompute => {
      // subtree
      if (includeSubtree) {
        return subscribeSubtree(componentId, childrenMap, (added, removed) => {
          for (const id of added) {
            if (!subtree.has(id)) {
              subtree.set(id, componentById.subscribe(id, requestRecompute));
            }
          }

          for (const id of removed) {
            if (subtree.has(id)) {
              subtree.get(id)(); // unsubscribe
              subtree.delete(id);
            }
          }

          requestRecompute();
        });
      }

      // single component
      subtree.set(
        componentId,
        componentById.subscribe(componentId, requestRecompute)
      );

      return () => {
        subtree.get(componentId)(); // unsubscribe
        subtree.delete(componentId);
      };
    },
    [componentId, includeSubtree, subtree]
  );

  return useDebouncedComputeSubscription(compute, subscribe, 50);
}
