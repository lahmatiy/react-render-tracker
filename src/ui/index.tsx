import * as React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { GlobalMapsContextProvider } from "./utils/global-maps";

// bootstrap HTML document
declare let __CSS__: string;
const rootEl = document.createElement("div");
document.head.appendChild(document.createElement("style")).append(__CSS__);
document.body.appendChild(rootEl);

// render React app
ReactDOM.render(
  <GlobalMapsContextProvider>
    <App />
  </GlobalMapsContextProvider>,
  rootEl
);
