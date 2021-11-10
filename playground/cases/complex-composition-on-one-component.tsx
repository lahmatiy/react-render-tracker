import * as React from "react";
import { TestCase } from "../types";

export default {
  title: "Complex composition on one component",
  Root,
} as TestCase;

function Root() {
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

function Foo({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function Bar({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

const BarMemo = React.memo(Baz);

function Baz({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function Qux() {
  return <>O</>;
}
