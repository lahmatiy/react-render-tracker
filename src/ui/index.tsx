import * as React from "react";
import ReactDOM from "react-dom";
import App from "./App";

// bootstrap HTML document
declare let __CSS__: string;
const rootEl = document.createElement("div");
document.head.appendChild(document.createElement("style")).append(__CSS__);
document.body.appendChild(rootEl);

// That's actually a hack.
// React add 2x listeners for all known events (one for capture and one for bubbling phases),
// and perform search for a proper fiber and event handlers on it. It turns out that
// on each pointer move there are 4-12 handlers are firing (pointermove & mousemove
// and optionally pointerover, pointerout, mouseover, mouseout). Currently, we don't use
// such event handlers, so avoid adding listeners for them to improve hover performance.
const rootElAddEventListener = rootEl.addEventListener;
rootEl.addEventListener = (
  ...args: Parameters<typeof rootElAddEventListener>
) => {
  if (!/^(pointer|mouse)/.test(args[0])) {
    rootElAddEventListener.call(rootEl, ...args);
  }
};

// render React app
ReactDOM.render(<App />, rootEl);
