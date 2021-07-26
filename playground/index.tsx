import * as React from "react";
import ReactDOM from "react-dom";
import attachReactRenderTracker from "../src/index.js";
import rempl from "rempl";

function App() {
  return "[app]";
}

attachReactRenderTracker(React.default);
ReactDOM.render(App(), document.getElementById("app"));

// NOTE: That's not a part of demo, and helps to try Rempl in action with zero setup.
// Although host is running inside page (btw, it calls in-page host) it load subscriber's UI
// into <iframe>. So actually publisher and subcriber communicate cross origin through
// event-based transport.
rempl.getHost().activate();
