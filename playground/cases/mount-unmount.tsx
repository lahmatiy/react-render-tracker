import { useState, useEffect } from "react";
import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Child() {
  useTrackRender();
  return <>OK</>;
}

function Root() {
  useTrackRender();
  const [isVisible, setIsVisible] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => mounted && setIsFirstRender(false));
    let mounted = true;

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isFirstRender]);

  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "Hide" : "Show"}
      </button>
      {(isVisible || isFirstRender) && <Child />}
    </>
  );
}

export default {
  title: "Mount/unmount",
  Root,
} as TestCase;
