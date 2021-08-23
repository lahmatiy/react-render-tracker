import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getSubscriber } from "rempl";
import App from "./App";
import { MessageElement, Message } from "./types";
import { GlobalMapsContextProvider, useGlobalMaps } from "./utils/global-maps";

// bootstrap HTML document
declare let __CSS__: string;
const rootEl = document.createElement("div");
document.head.appendChild(document.createElement("style")).append(__CSS__);
document.body.appendChild(rootEl);

// render React app
ReactDOM.render(
  <GlobalMapsContextProvider>
    <AppWithData />
  </GlobalMapsContextProvider>,
  rootEl
);

// subscribe to data and pass it to app
function AppWithData() {
  const maps = useGlobalMaps();

  useEffect(() => {
    const MAX_EVENT_COUNT = 256;
    let lastOffset = 0;
    let totalCount = 0;
    let loading = false;
    const channel = getSubscriber().ns("tree-changes");
    const loadRemoteEvents = channel.getRemoteMethod("getEvents");
    const loadEvents = () => {
      if (loading || lastOffset >= totalCount) {
        return;
      }

      loading = true;
      loadRemoteEvents(
        lastOffset,
        Math.min(totalCount - lastOffset, MAX_EVENT_COUNT),
        (events: Message[]) => {
          processEvents(events, maps);
          lastOffset += events.length;
          loading = false;

          // call load events to make sure there are no more events
          setTimeout(() => loadEvents(), 250);
        }
      );
    };

    return channel.subscribe((data: { count: number } | null) => {
      const { count } = data || { count: 0 };

      if (count !== totalCount) {
        totalCount = count;
        loadEvents();
      }
    });
  }, []);

  return <App />;
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

function processEvents(
  events: Message[],
  {
    componentById,
    componentsByParentId,
    componentsByOwnerId,
  }: ReturnType<typeof useGlobalMaps>
) {
  const updated = new Set<number>();

  for (const event of events) {
    let element: MessageElement;

    switch (event.op) {
      case "mount": {
        element = {
          ...event.element,
          mounted: true,
          events: [],
        };

        upsertComponent(componentsByParentId, element.parentId, element.id);
        updated.add(element.parentId);

        upsertComponent(componentsByOwnerId, element.ownerId, element.id);
        updated.add(element.ownerId);
        break;
      }

      case "unmount": {
        element = {
          ...componentById.get(event.elementId),
          mounted: false,
        };
        break;
      }

      default:
        element = componentById.get(event.elementId);
    }

    updated.add(element.id);
    componentById.set(event.elementId, {
      ...element,
      events: element.events.concat(event),
    });
  }

  // console.log("updated", [...updated], events);
  for (const id of updated) {
    componentById.notify(id);
    componentsByOwnerId.notify(id);
    componentsByParentId.notify(id);
  }

  return [...componentById.values()];
}
