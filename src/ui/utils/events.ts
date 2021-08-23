import * as React from "react";
import debounce from "lodash.debounce";
import { useGlobalMaps } from "./global-maps";
import { subscribeSubtree } from "./tree";
import { Message, MessageElement } from "../types";

export const useEventLog = (
  componentId: number,
  groupByParent: boolean,
  includeUnmounted: boolean,
  includeSubtree: boolean
) => {
  const { componentById, selectChildrenMap } = useGlobalMaps();
  const subtree = React.useMemo(() => new Map<number, () => void>(), []);
  const [events, setEvents] =
    React.useState<{ component: MessageElement; event: Message }[]>();
  const syncEvents = React.useMemo(
    () =>
      debounce(() => {
        const events = [];

        for (const id of subtree.keys()) {
          const component = componentById.get(id);
          for (const event of component.events) {
            events.push({ component, event });
          }
        }

        setEvents(events.sort((a, b) => a.event.id - b.event.id));
      }, 1) as () => void,
    []
  );
  const childrenMap = selectChildrenMap(groupByParent, includeUnmounted);

  React.useEffect(() => {
    // subtree
    if (includeSubtree) {
      return subscribeSubtree(componentId, childrenMap, (added, removed) => {
        for (const id of added) {
          if (!subtree.has(id)) {
            subtree.set(id, componentById.subscribe(id, syncEvents));
          }
        }

        for (const id of removed) {
          if (subtree.has(id)) {
            subtree.get(id)();
            subtree.delete(id);
          }
        }

        syncEvents();
      });
    }

    // single component
    subtree.set(componentId, componentById.subscribe(componentId, syncEvents));
    return () => {
      subtree.get(componentId)();
      subtree.delete(componentId);
    };
  }, [componentId, includeSubtree, subtree, childrenMap]);

  return events;
};
