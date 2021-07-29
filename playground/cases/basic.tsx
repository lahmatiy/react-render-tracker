import { useCallback, useState } from "react";
import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Child() {
  useTrackRender();
  return <>OK</>;
}

function Root() {
  useTrackRender();
  const [ isVisible, setIsVisible ] = useState(false);

  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>{isVisible ? "Hide" : "Show"}</button>
      {isVisible && <Child />}
    </>
  );
}

export default {
  title: "Basic nested render",
  Root
} as TestCase;
