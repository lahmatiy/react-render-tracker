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

function markUpdated(map, id, type) {
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

function processEvents(
  events: Message[],
  {
    componentById,
    componentsByParentId,
    componentsByOwnerId,
    mountedComponentsByParentId,
    mountedComponentsByOwnerId,
  }: ReturnType<typeof useGlobalMaps>
) {
  const updated = new Map<number, number>();

  for (const event of events) {
    let element: MessageElement;

    switch (event.op) {
      case "mount": {
        element = {
          ...event.element,
          mounted: true,
          events: [],
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

      default:
        element = componentById.get(event.elementId);
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

  return [...componentById.values()];
}
