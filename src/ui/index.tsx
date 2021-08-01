/* globals __CSS__ */

import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getSubscriber } from "rempl";
import App from "./App";
import {
  TransferChangeDescription,
  MessageElement,
  Message,
  ElementUpdate,
} from "./types";

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
        .subscribe((messages: Message[] = []) => {
          setData(processMessages(messages));
        }),
    [setData]
  );

  return <App data={data} />;
}

function processMessages(messages: Message[]) {
  const componentById: Map<number, MessageElement> = new Map();
  const updatesByComponentId = new Map();

  for (const message of messages) {
    switch (message.op) {
      case "add":
        message.element;
        componentById.set(message.id, {
          ...message.element,
          mounted: true,
          updates: [],
        });
        break;

      case "remove":
        componentById.get(message.id).mounted = false;
        break;

      case "update":
        const update = processChange(
          message.changes,
          message.timestamp,
          componentById.get(message.id)
        );

        if (updatesByComponentId.has(message.id)) {
          updatesByComponentId.get(message.id).push(update);
        } else {
          updatesByComponentId.set(message.id, [update]);
        }

        break;
    }
  }

  for (const [id, updates] of updatesByComponentId) {
    if (componentById.has(id)) {
      componentById.get(id).updates = updates;
    } else {
      console.warn(`Component ${id} not found but there are a changes`);
    }
  }

  return [...componentById.values()];
}

function processChange(
  value: TransferChangeDescription,
  timestamp: number,
  component: MessageElement
) {
  const { didHooksChange, isFirstMount, props, state, hooks, parentUpdate } =
    value;
  const change: ElementUpdate = {
    phase: "Update",
    timestamp,
    reason: [],
    details: {},
    __orig: value,
  };

  if (component && !component.mounted) {
    change.phase = "Unmount";
  } else if (isFirstMount) {
    change.phase = "Mount";
  }

  if (didHooksChange && hooks?.length > 0) {
    change.reason.push("Hooks Change");
    change.details.hooks = hooks;
  }

  if (props != null && props.length > 0) {
    change.reason.push("Props Change");
    change.details.props = props;
  }

  if (state != null && state.length > 0) {
    change.reason.push("State Change");
    change.details.state = state;
  }

  if (parentUpdate) {
    change.reason.push("Parent Update");
  }

  return change;
}
