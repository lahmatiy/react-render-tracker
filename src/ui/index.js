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
        .subscribe(changes => {
          const componentTree = {};

          if (!changes) {
            changes = [];
          }

          for (const change of changes) {
            const { addedElements, removedElementIDs } = change;

            if (addedElements.length) {
              for (const element of addedElements) {
                componentTree[element.id] = element;
              }
            }

            if (removedElementIDs.length) {
              for (const id of removedElementIDs) {
                componentTree[id].isUnmounted = true;
              }
            }
          }

          setData(componentTree);
        }),
    [setData]
  );

  return <App data={data} />;
}
