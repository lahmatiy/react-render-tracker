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
    () => getSubscriber().ns("component-tree").subscribe(setData),
    [setData]
  );

  return <App data={data} />;
}
