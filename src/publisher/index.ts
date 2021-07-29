import rempl from "rempl";
import { Bridge } from "./bridge";
import { installHook } from "./install-hook";

const __win__ = window;

function start() {
  const publisher = rempl.createPublisher(
    "react-render-tracker",
    (settings, callback) => {
      fetch("./subscriber.js")
        .then(res => res.text())
        .then(script => callback(null, "script", script));
    }
  );

  const hook = installHook(__win__);
  const bridge = new Bridge(hook, publisher);
  console.log(bridge);
}

start();
