/* globals __CSS__ */

import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getSubscriber } from "rempl";
import App from "./App";
import { MessageElement, Message } from "./types";

// bootstrap HTML document
declare var __CSS__: string;
const rootEl = document.createElement("div");
document.head.appendChild(document.createElement("style")).append(__CSS__);
document.body.appendChild(rootEl);

// render React app
ReactDOM.render(<AppWithData />, rootEl);

// subscribe to data and pass it to app
function AppWithData() {
  const [data, setData] = React.useState<MessageElement[]>([]);

  useEffect(
    () =>
      getSubscriber()
        .ns("tree-changes")
        .subscribe((events: Message[] = []) => {
          setData(processEvents(events));
        }),
    [setData]
  );

  return <App data={data} />;
}

function processEvents(events: Message[]) {
  const componentById: Map<number, MessageElement> = new Map();
  const eventsByComponentId = new Map();

  for (const event of events) {
    switch (event.op) {
      case "mount": {
        componentById.set(event.elementId, {
          ...event.element,
          mounted: true,
          events: [],
        });
        break;
      }

      case "unmount": {
        componentById.get(event.elementId).mounted = false;
        break;
      }
    }

    if (eventsByComponentId.has(event.elementId)) {
      eventsByComponentId.get(event.elementId).push(event);
    } else {
      eventsByComponentId.set(event.elementId, [event]);
    }
  }

  for (const [id, updates] of eventsByComponentId) {
    if (componentById.has(id)) {
      componentById.get(id).events = updates;
    } else {
      console.warn(`Component ${id} not found but there are a changes`);
    }
  }

  return [...componentById.values()];
}
