import * as React from "react";
import { useEffect } from "react";
import { TestCase } from "../types";

export default {
  title: "Mount/unmount",
  Root,
} as TestCase;

function Root() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFirstRender, setIsFirstRender] = React.useState(true);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => mounted && setIsFirstRender(false), 1);

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

function Child() {
  return <>OK</>;
}
