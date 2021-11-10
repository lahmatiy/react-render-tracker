import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Set state by event handler",
  Root,
} as TestCase;

function Root() {
  return <Child />;
}

function Child() {
  const [ok, setOk] = React.useState(false);

  if (!ok) {
    return (
      <div data-send-event="click" onClick={() => setOk(true)}>
        Failed: waiting for click event
      </div>
    );
  }
  return <>OK</>;
}
