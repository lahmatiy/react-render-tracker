import "./publisher/index";
import rempl from "rempl";

export const publisher = rempl.createPublisher(
  "react-render-tracker",
  (settings, callback) => {
    fetch("./subscriber.js")
      .then(res => res.text())
      .then(script => callback(null, "script", script));
  }
);
