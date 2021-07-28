// data publisher
import rempl from "rempl";
import data from "./mock-data.js";

const publisher = rempl.createPublisher(
  "react-render-tracker",
  (settings, callback) => {
    fetch("./subscriber.js")
      .then(res => res.text())
      .then(script => callback(null, "script", script));
  }
);

export default function (React) {
  if (React.default) {
    React = React.default;
  }

  // console.log("Will attach to ", React);

  publisher.ns("component-tree").publish(data);
}
