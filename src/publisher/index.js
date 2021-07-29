import rempl from "rempl";
import { installHook } from "./hook.js";
import { init } from "./backend.js";

export const publisher = rempl.createPublisher(
  "react-render-tracker",
  (settings, callback) => {
    fetch("./subscriber.js")
      .then(res => res.text())
      .then(script => callback(null, "script", script));
  }
);

const hook = installHook(window);
init(hook, window);
