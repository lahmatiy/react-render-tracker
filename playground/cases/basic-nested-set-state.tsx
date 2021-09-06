import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Basic nested render with setState() via useEffect()",
  Root,
} as TestCase;

function Root() {
  useTrackRender();
  return <Child />;
}

function Child() {
  const { useState } = useTrackRender();
  const [mounted, setMounted] = useState("Fail: waiting for mount");

  React.useEffect(() => {
    setMounted("OK");
  }, []);

  return <>{mounted}</>;
}
