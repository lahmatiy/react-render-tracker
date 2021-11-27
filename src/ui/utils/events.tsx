import * as React from "react";
import * as ReactDOM from "react-dom";
import { stringifyInfo } from "@discoveryjs/json-ext";
import { remoteSubscriber } from "../rempl-subscriber";
import { useFiberMaps } from "./fiber-maps";
import { subscribeSubtree } from "./tree";
import {
  FiberChanges,
  FiberEvent,
  FiberStateChange,
  LinkedEvent,
  Message,
  MessageFiber,
  TransferFiberChanges,
  TransferPropChange,
} from "../types";
import { flushNotify, useDebouncedComputeSubscription } from "./subscription";
import { ElementTypeProvider } from "../../common/constants";

interface EventsContext {
  allEvents: Message[];
  events: Message[];
  loadingStartOffset: number;
  loadedEventsCount: number;
  totalEventsCount: number;
  bytesReceived: number;
  mountCount: number;
  unmountCount: number;
  updateCount: number;
  clearAllEvents: () => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
}

const noop = () => undefined;
const createEventsContextValue = (): EventsContext => ({
  allEvents: [],
  events: [],
  loadingStartOffset: 0,
  loadedEventsCount: 0,
  totalEventsCount: 0,
  bytesReceived: 0,
  mountCount: 0,
  unmountCount: 0,
  updateCount: 0,
  clearAllEvents: noop,
  paused: true,
  setPaused: noop,
});
const EventsContext = React.createContext(createEventsContextValue());
export const useEventsContext = () => React.useContext(EventsContext);

export function EventsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState(createEventsContextValue);
  const { allEvents } = state;
  const linkedEvents = React.useMemo(() => new Map<Message, LinkedEvent>(), []);
  const eventsSince = React.useRef(0);
  const [paused, setStatePaused] = React.useState(false);
  const setEffectPaused = React.useRef<(paused: boolean) => void>(noop);
  const setPaused = React.useCallback((paused: boolean) => {
    setStatePaused(paused);
    setEffectPaused.current(paused);
  }, []);
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
          updatesBailoutCount: 0,
          updatesBailoutStateCount: 0,
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
      paused,
      setPaused,
      clearAllEvents,
    }),
    [state, paused, setPaused, clearAllEvents]
  );

  React.useEffect(() => {
    const channel = remoteSubscriber.ns("tree-changes");
    const remoteLoadEvents = channel.getRemoteMethod("getEvents");

    channel.onRemoteMethodsChanged(methods => {
      if (methods.includes("getEvents")) {
        loadEvents();
      }
    });

    const EVENT_COUNT = 512;
    let loadingStartOffset = 0;
    let lastLoadedOffset = 0;
    let totalEventsCount = 0;
    let loading = false;
    let paused = false;
    let pendingEventsChunk: Message[] | null = null;

    setEffectPaused.current = (newPaused: boolean) => {
      if (newPaused !== paused) {
        paused = newPaused;

        if (!paused) {
          applyEventsChunk();
          loadEvents();
        } else {
          setTimeout(() => flushUpdatedMaps(), 16);
        }
      }
    };

    const applyEventsChunk = () => {
      if (paused || pendingEventsChunk === null) {
        return;
      }

      const eventsChunk = pendingEventsChunk;
      pendingEventsChunk = null;
      lastLoadedOffset += eventsChunk.length;
      loading = false;
      loadEvents(); // call load events to make sure there are no more events

      const { minLength: bytesReceived } = stringifyInfo(eventsChunk);
      const { mountCount, unmountCount, updateCount } = processEvents(
        eventsChunk,
        allEvents,
        linkedEvents,
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
        loadingStartOffset = totalEventsCount;
        // flush updates async
        setTimeout(() => flushUpdatedMaps(), 16);
        return;
      }

      if (paused) {
        return;
      }

      loading = true;
      remoteLoadEvents(
        lastLoadedOffset,
        Math.min(totalEventsCount - lastLoadedOffset, EVENT_COUNT),
        (eventsChunk: Message[]) => {
          pendingEventsChunk = eventsChunk;
          applyEventsChunk();
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

function isShallowEqual(entry: TransferPropChange | FiberStateChange) {
  return entry.diff === false;
}

function eventChangesWarnings(
  fiber: MessageFiber,
  changes: FiberChanges | null
) {
  const warnings: FiberChanges["warnings"] = new Set();

  if (fiber.type === ElementTypeProvider && changes?.props) {
    const shallowValueChange = changes.props.find(
      change => change.name === "value" && isShallowEqual(change)
    );

    if (shallowValueChange) {
      warnings.add(shallowValueChange);
    }
  }

  if (changes?.state) {
    for (const change of changes.state) {
      if (isShallowEqual(change)) {
        warnings.add(change);
      }
    }
  }

  return warnings.size > 0 ? warnings : null;
}

export function processEvents(
  newEvents: Message[],
  allEvents: Message[],
  linkedEvents: Map<Message, LinkedEvent>,
  {
    commitById,
    fiberById,
    fiberTypeDefById,
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

  let fiberEventIndex = allEvents.length;
  allEvents.length += newEvents.length;

  const linkEvent = <T extends LinkedEvent>(linkedEvent: T): T => {
    const { event } = linkedEvent;
    const trigger =
      ("trigger" in event &&
        event.trigger !== undefined &&
        linkedEvents.get(allEvents[event.trigger])) ||
      null;

    linkedEvent.trigger = trigger;
    linkedEvents.set(event, linkedEvent);

    return linkedEvent;
  };
  const normChanges = (
    fiber: MessageFiber,
    changes: TransferFiberChanges | null
  ) => {
    if (changes === null) {
      return null;
    }

    const normalizedChanges: FiberChanges = {
      ...changes,
      warnings: null,
      state: changes?.state?.map(change => ({
        ...change,
        hook: change.hook !== null ? fiber.typeDef.hooks[change.hook] : null,
      })),
      context:
        changes.context?.map(change => {
          const linkedEvent = linkedEvents.get(
            allEvents[change.valueChangedEventId]
          ) as FiberEvent;
          const { prev, next, diff } =
            linkedEvent?.changes?.props?.find(prop => prop.name === "value") ||
            {};

          return {
            context: fiber.typeDef.contexts?.[change.context] || null,
            prev,
            next,
            diff,
          };
        }) || null,
    };

    normalizedChanges.warnings = eventChangesWarnings(fiber, normalizedChanges);

    return normalizedChanges;
  };

  for (const event of newEvents) {
    let fiber: MessageFiber;
    let changes: FiberChanges | null = null;

    allEvents[fiberEventIndex++] = event;

    switch (event.op) {
      case "fiber-type-def": {
        fiberTypeDefById.set(event.typeId, {
          ...event.definition,
          hooks: event.definition.hooks.map((hook, index) => ({
            index,
            ...hook,
            context:
              typeof hook.context === "number"
                ? event.definition.contexts?.[hook.context] || null
                : null,
          })),
        });
        continue;
      }

      case "mount": {
        const typeDef = fiberTypeDefById.get(event.fiber.typeId) || {
          contexts: null,
          hooks: [],
        };

        mountCount++;

        fiber = {
          ...event.fiber,
          typeDef,
          displayName:
            event.fiber.displayName ||
            (!event.fiber.ownerId ? "Render root" : "Unknown"),
          mounted: true,
          events: [],
          updatesCount: 0,
          updatesBailoutCount: 0,
          updatesBailoutStateCount: 0,
          warnings: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        fibersByTypeId.add(fiber.typeId, fiber.id);
        parentTree.add(fiber.id, fiber.parentId);
        parentTreeIncludeUnmounted.add(fiber.id, fiber.parentId);
        ownerTree.add(fiber.id, fiber.ownerId);
        ownerTreeIncludeUnmounted.add(fiber.id, fiber.ownerId);

        if (typeDef.contexts) {
          for (const { providerId } of typeDef.contexts) {
            if (typeof providerId === "number") {
              fibersByProviderId.add(providerId, fiber.id);
            }
          }
        }

        break;
      }

      case "unmount": {
        unmountCount++;

        fiber = fiberById.get(event.fiberId) as MessageFiber;
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

        fiber = fiberById.get(event.fiberId) as MessageFiber;
        changes = normChanges(fiber, event.changes);
        fiber = {
          ...fiber,
          updatesCount: fiber.updatesCount + 1,
          selfTime: fiber.selfTime + event.selfTime,
          totalTime: fiber.totalTime + event.totalTime,
          warnings: fiber.warnings + (changes?.warnings?.size || 0),
        };

        break;

      case "update-bailout-state":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
          updatesBailoutStateCount: fiber.updatesBailoutStateCount + 1,
        };
        break;

      case "update-bailout-memo":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
        };
        break;

      case "update-bailout-scu":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
        };
        changes = normChanges(fiber, event.changes);
        break;

      // case "effect-create":
      // case "effect-destroy":
      //   fiber = fiberById.get(event.fiberId)!;
      //   break;

      case "commit-start":
        commitById.set(event.commitId, {
          start: linkEvent({
            target: "commit",
            targetId: event.commitId,
            event,
            trigger: null,
          }),
          finish: null,
        });
        continue;

      default:
        continue;
    }

    fiber = {
      ...fiber,
      events: fiber.events.concat(
        linkEvent({
          target: "fiber",
          targetId: event.fiberId,
          event,
          changes,
          trigger: null,
          triggeredByOwner: false,
        })
      ),
    };

    fiberById.set(event.fiberId, fiber);
    parentTree.setFiber(fiber.id, fiber);
    parentTreeIncludeUnmounted.setFiber(fiber.id, fiber);
    ownerTree.setFiber(fiber.id, fiber);
    ownerTreeIncludeUnmounted.setFiber(fiber.id, fiber);
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

  const compute = React.useCallback((): LinkedEvent[] => {
    const commitIds = new Set<number>();
    const events = [];

    for (const id of subtree.keys()) {
      const fiber = fiberById.get(id);

      if (fiber) {
        for (const linkedEvent of fiber.events) {
          commitIds.add(linkedEvent.event.commitId);
          events.push(linkedEvent);
        }
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
