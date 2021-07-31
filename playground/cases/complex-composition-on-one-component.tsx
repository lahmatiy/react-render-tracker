import { useCallback, useState } from "react";
import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Foo({ children }) {
  useTrackRender();
  return <>{children}</>;
}

function Bar({ children = null }) {
  useTrackRender();
  return <>{children}</>;
}

function Baz({ children }) {
  useTrackRender();
  return <>{children}</>;
}

function Qux() {
  useTrackRender();
  return <>OK</>;
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
    </Foo>
  );
}

export default {
  title: "Complex composition on one component",
  Root,
} as TestCase;
