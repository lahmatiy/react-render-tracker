import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getSubscriber } from "rempl";
import App from "./App";

// bootstrap HTML document
document.head.appendChild(document.createElement("style")).append(__CSS__);
const rootEl = document.createElement("div");
document.body.appendChild(rootEl);

// render React app
ReactDOM.render(<AppWithData />, rootEl);

// subscribe to data and pass it to app
function AppWithData() {
  const [data, setData] = React.useState(null);

  useEffect(
    () =>
      getSubscriber()
        .ns("tree-changes")
        .subscribe((messages = []) => {
          const [operationMessages, profilingMessages] =
            splitMessages(messages);

          const [componentTree, removedElements] =
            parseOperationMessages(operationMessages);

          parseProfilingMessages(
            profilingMessages,
            componentTree,
            removedElements
          );

          setData(componentTree);
        }),
    [setData]
  );

  return <App data={data} />;
}

function splitMessages(messages) {
  const operationMessages = [];
  const profilingMessages = [];

  for (const message of messages) {
    switch (message.type) {
      case "operations":
        operationMessages.push(message);
        continue;
      case "profiling":
        profilingMessages.push(message);
        continue;
      default:
        console.warn(`unsupported message type "${message.type}"`);
    }
  }

  return [operationMessages, profilingMessages];
}

function parseOperationMessages(messages) {
  const componentMap = {};
  const removedElements = new Set();
  for (const message of messages) {
    const { addedElements, removedElementIds } = message;

    for (const element of addedElements) {
      componentMap[element.id] = element;
    }

    for (const id of removedElementIds) {
      const parentId = componentMap[id].parentId;
      componentMap[id].isUnmounted = true;
      componentMap[parentId].children.push(id);
      removedElements.add(id);
    }
  }

  return [componentMap, removedElements];
}

function parseProfilingMessages(messages, componentTree, removedElements) {
  for (const message of messages) {
    const { changeDescriptions, timestamp } = message;

    if (changeDescriptions) {
      for (const [key, value] of Object.entries(changeDescriptions)) {
        const {
          didHooksChange,
          isFirstMount,
          props,
          state,
          hooks,
          parentUpdate,
        } = value;
        const change = {
          timestamp: new Date(timestamp).toISOString(),
          reason: [],
          details: {},
        };

        if (removedElements.has(key)) {
          change.phase = "Unmount";
        } else if (isFirstMount) {
          change.phase = "Mount";
        } else {
          change.phase = "Update";
        }

        if (didHooksChange && hooks != null && hooks.length > 0) {
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

        if (!componentTree[key]) {
          componentTree[key] = {};
        }

        if (!componentTree[key].changes) {
          componentTree[key].changes = {};
        }

        componentTree[key].changes[change.timestamp] = change;
      }
    }
  }
}
