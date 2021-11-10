import * as React from "react";
import { TestCase } from "../types";

export default {
  title: "Basic render with changed parent element",
  Root,
} as TestCase;

function Root() {
  return <ChildWrapper />;
}

function ChildWrapper() {
  const [mounted, setMounted] = React.useState("Fail: waiting for mount");

  React.useEffect(() => {
    setMounted("OK");
  }, []);

  return (
    <p>
      {mounted}
      <Child />
    </p>
  );
}

function Child() {
  return <>child element</>;
}
