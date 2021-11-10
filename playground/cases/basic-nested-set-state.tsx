import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Basic nested render with setState() via useEffect()",
  Root,
} as TestCase;

function Root() {
  return <Child />;
}

function Child() {
  const [mounted, setMounted] = React.useState("Fail: waiting for mount");

  React.useEffect(() => {
    setMounted("OK");
  }, []);

  return <>{mounted}</>;
}
