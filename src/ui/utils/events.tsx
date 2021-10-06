import * as React from "react";
import * as ReactDOM from "react-dom";
import { stringifyInfo } from "@discoveryjs/json-ext";
import { remoteSubscriber } from "../rempl-subscriber";
import { useFiberMaps } from "./fiber-maps";
import { subscribeSubtree } from "./tree";
import {
  FiberEvent,
  Message,
  MessageFiber,
  TransferNamedEntryChange,
} from "../types";
import { flushNotify, useDebouncedComputeSubscription } from "./subscription";

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
  const { fiberById, parentTreeIncludeUnmounted, ownerTreeIncludeUnmounted } =
    maps;
  const clearAllEvents = React.useCallback(() => {
    for (const [id, fiber] of fiberById) {
      if (fiber.events.length > 0) {
        fiberById.set(id, {
          ...fiber,
          events: [],
          warnings: 0,
          updatesCount: 0,
          totalTime: 0,
          selfTime: 0,
        });
      }

      if (!fiber.mounted) {
        parentTreeIncludeUnmounted.delete(fiber.id);
        ownerTreeIncludeUnmounted.delete(fiber.id);
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

    flushNotify();
  }, [fiberById, parentTreeIncludeUnmounted, ownerTreeIncludeUnmounted]);
  const value = React.useMemo(
    () => ({
      ...state,
      clearAllEvents,
    }),
    [state, clearAllEvents]
  );

  React.useEffect(() => {
    const channel = remoteSubscriber.ns("tree-changes");
    const remoteLoadEvents = channel.getRemoteMethod("getEvents");

    channel.onRemoteMethodsChanged(methods => {
      if (methods.includes("getEvents")) {
        loadEvents();
      }
    });

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
      if (loading || !remoteLoadEvents.available) {
        return;
      }

      if (lastLoadedOffset < eventsSince.current) {
        loadingStartOffset = eventsSince.current;
        lastLoadedOffset = eventsSince.current;
      }

      if (lastLoadedOffset >= totalEventsCount) {
        // flush updates async
        setTimeout(() => flushUpdatedMaps(), 0);
        loadingStartOffset = totalEventsCount;
        return;
      }

      loading = true;
      remoteLoadEvents(
        lastLoadedOffset,
        Math.min(totalEventsCount - lastLoadedOffset, MAX_EVENT_COUNT),
        (eventsChunk: Message[]) => {
          lastLoadedOffset += eventsChunk.length;

          // call load events to make sure there are no more events
          if (TROTTLE) {
            setTimeout(finalizeLoading, 250);
          } else {
            finalizeLoading();
          }

          if (eventsChunk.length > 0) {
            const { minLength: bytesReceived } = stringifyInfo(eventsChunk);
            const { mountCount, unmountCount, updateCount } = processEvents(
              eventsChunk,
              allFiberEvents,
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

function isShallowEqual(entry: TransferNamedEntryChange) {
  return entry.diff === false;
}

export function processEvents(
  events: Message[],
  allFiberEvents: FiberEvent[],
  {
    fiberById,
    fibersByTypeId,
    fibersByProviderId,
    parentTree,
    parentTreeIncludeUnmounted,
    ownerTree,
    ownerTreeIncludeUnmounted,
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

        fibersByTypeId.add(fiber.typeId, fiber.id);
        parentTree.add(fiber.id, fiber.parentId);
        parentTreeIncludeUnmounted.add(fiber.id, fiber.parentId);
        ownerTree.add(fiber.id, fiber.ownerId);
        ownerTreeIncludeUnmounted.add(fiber.id, fiber.ownerId);

        if (fiber.contexts) {
          for (const { providerId } of fiber.contexts) {
            if (typeof providerId === "number") {
              fibersByProviderId.add(providerId, fiber.id);
            }
          }
        }

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

        parentTree.delete(fiber.id);
        ownerTree.delete(fiber.id);

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

function flushUpdatedMaps() {
  ReactDOM.unstable_batchedUpdates(() => {
    flushNotify();
  });
}

export function useEventLog(
  fiberId: number,
  groupByParent: boolean,
  includeUnmounted: boolean,
  includeSubtree: boolean
) {
  const { fiberById, selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, includeUnmounted);
  const subtree = React.useMemo(
    () => new Map<number, () => void>(),
    [fiberId, includeSubtree, fiberById, tree]
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
        return subscribeSubtree(fiberId, tree, (added, removed) => {
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
