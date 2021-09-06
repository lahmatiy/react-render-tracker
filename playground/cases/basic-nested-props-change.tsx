import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Basic render with changed props via useEffect() and useState",
  Root,
} as TestCase;

function Root() {
  useTrackRender();
  return <ChildWrapper />;
}

function ChildWrapper() {
  const { useState } = useTrackRender();
  const [mounted, setMounted] = useState("Fail: waiting for mount");

  React.useEffect(() => {
    setMounted("OK");
  }, []);

  return <Child mounted={mounted} />;
}

function Child({ mounted }: { mounted: string }) {
  useTrackRender();
  return <>{mounted}</>;
}
