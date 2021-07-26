// data publisher
import rempl from "rempl";

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
  console.log("Will attach to ", React);
  publisher.publish("Hello from app/publisher. React version " + React.version);
}
