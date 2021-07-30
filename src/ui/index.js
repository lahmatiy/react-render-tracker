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
          const componentTree = {};

          for (const message of messages) {
            switch (message.type) {
              case "operations":
                applyOperationMessage(message, componentTree);
                continue;
              case "profiling":
                applyProfilingMessage(message, componentTree);
                continue;
              default:
                console.warn(`unsupported message type "${message.type}"`);
            }
          }
          setData(componentTree);
        }),
    [setData]
  );

  return <App data={data} />;
}

function applyProfilingMessage(message, componentTree) {
  const { changeDescriptions, timestamp } = message;

  if (changeDescriptions) {
    for (const [key, value] of changeDescriptions.entries()) {
      const {
        didHooksChange,
        isUnmount,
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

      if (isUnmount) {
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

function applyOperationMessage(message, componentTree) {
  const { addedElements, removedElementIds } = message;

  if (addedElements.length) {
    for (const element of addedElements) {
      const existingElement = componentTree[element.id];

      componentTree[element.id] = { ...existingElement, ...element };
    }
  }

  if (removedElementIds.length) {
    for (const id of removedElementIds) {
      const parentId = componentTree[id].parentId;
      componentTree[id].isUnmounted = true;
      componentTree[parentId].children.push(id);

      // FIXME
      // changeDescriptions[id] = {
      //   isUnmount: true,
      // };
    }
  }
}
