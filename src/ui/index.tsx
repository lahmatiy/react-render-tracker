import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getSubscriber } from "rempl";
import App from "./App";
import { MessageElement, Message } from "./types";
import {
  GlobalMapsContextProvider,
  useGlobalMaps,
} from "./utils/componentMaps";

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
  const [data, setData] = React.useState<MessageElement[]>([]);
  const maps = useGlobalMaps();

  useEffect(() => {
    let lastOffset = 0;
    return getSubscriber()
      .ns("tree-changes")
      .subscribe((events: Message[] = []) => {
        processEvents(events.slice(lastOffset), maps);
        lastOffset = events.length;
      });
  }, [setData]);

  return <App data={data} />;
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

  console.log("updated", [...updated], events);
  for (const id of updated) {
    componentById.notify(id);
    componentsByOwnerId.notify(id);
    componentsByParentId.notify(id);
  }

  return [...componentById.values()];
}
