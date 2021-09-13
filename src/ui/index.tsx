import * as React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { FiberMapsContextProvider } from "./utils/fiber-maps";

// bootstrap HTML document
declare let __CSS__: string;
const rootEl = document.createElement("div");
document.head.appendChild(document.createElement("style")).append(__CSS__);
document.body.appendChild(rootEl);

// render React app
ReactDOM.render(
  <FiberMapsContextProvider>
    <App />
  </FiberMapsContextProvider>,
  rootEl
);
