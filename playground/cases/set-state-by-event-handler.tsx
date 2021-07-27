import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Child() {
  const { useState } = useTrackRender();
  const [ok, setOk] = useState(false);

  if (!ok) {
    return (
      <div data-send-event="click" onClick={() => setOk(true)}>
        Failed: waiting for click event
      </div>
    );
  }
  return <>OK</>;
}

function Root() {
  useTrackRender();
  return <Child />;
}

export default {
  title: "Basic nested render",
  Root,
} as TestCase;
