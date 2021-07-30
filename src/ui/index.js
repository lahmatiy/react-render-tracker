// import { getSubscriber } from "rempl";
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
        .subscribe((changes = []) => {
          // TODO refactor into separate helper func pls
          const componentTree = {};

          for (const change of changes) {
            const {
              addedElements,
              removedElementIDs,
              latestCommitProfilingMetadata,
            } = change;

            const { changeDescriptions, timestamp } =
              latestCommitProfilingMetadata;

            if (addedElements.length) {
              for (const element of addedElements) {
                componentTree[element.id] = element;
              }
            }

            if (removedElementIDs.length) {
              for (const id of removedElementIDs) {
                const parentId = componentTree[id].parentId;
                componentTree[id].isUnmounted = true;
                componentTree[parentId].children.push(id);

                changeDescriptions[id] = {
                  isUnmount: true,
                };
              }
            }

            const changedIDs = Object.keys(changeDescriptions);

            if (changedIDs.length) {
              for (const id of changedIDs) {
                const {
                  didHooksChange,
                  isUnmount,
                  isFirstMount,
                  props,
                  state,
                  hooks,
                  parentUpdate,
                } = changeDescriptions[id];
                const change = {
                  timestamp,
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

                if (componentTree[id]) {
                  if (!componentTree[id].changes) {
                    componentTree[id].changes = {};
                  }

                  componentTree[id].changes[change.timestamp] = change;
                } else {
                  console.error(
                    "No component in componentTree",
                    id,
                    componentTree
                  );
                }
              }
            }
          }

          setData(componentTree);
        }),
    [setData]
  );

  return <App data={data} />;
}
