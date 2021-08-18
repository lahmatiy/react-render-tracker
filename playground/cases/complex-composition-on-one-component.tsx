import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Foo({ children }: { children: JSX.Element }) {
  useTrackRender();
  return <>{children}</>;
}

function Bar({ children }: { children: JSX.Element }) {
  useTrackRender();
  return <>{children}</>;
}

const BarMemo = React.memo(Baz);

function Baz({ children }: { children: JSX.Element }) {
  useTrackRender();
  return <>{children}</>;
}

function Qux() {
  useTrackRender();
  return <>O</>;
}

function Root() {
  useTrackRender();
  return (
    <Foo>
      <Bar />
      <Baz>
        <Bar>
          <Qux />
        </Bar>
      </Baz>
      <BarMemo>K</BarMemo>
    </Foo>
  );
}

export default {
  title: "Complex composition on one component",
  Root,
} as TestCase;
