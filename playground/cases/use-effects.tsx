import React from "../react";
import { TestCase } from "../types";

export default {
  title: "useEffect()/useLayoutEffect()",
  Root,
} as TestCase;

function Root() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [, setState] = React.useState(0);

  React.useEffect(() => {
    setState(Date.now());
  }, []);

  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "Hide" : "Show"}
      </button>
      {isVisible && <Child />}
    </>
  );
}

function usePassiveEffects() {
  React.useEffect(() => {
    return () => {
      /* destroy */
    };
  });

  React.useEffect(() => {
    /* no destroy */
  });
}

function useLayoutEffects() {
  React.useLayoutEffect(() => {
    return () => {
      /* destroy */
    };
  });

  React.useLayoutEffect(() => {
    /* no destroy */
  });
}

function useEffects() {
  usePassiveEffects();
  useLayoutEffects();
}

function Child() {
  useEffects();

  return <>OK</>;
}
