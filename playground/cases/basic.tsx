import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

function Child() {
  useTrackRender();
  return <>OK</>;
}

function Root() {
  useTrackRender();
  return <Child />;
}

export default {
  title: "Basic nested render",
  Root,
} as TestCase;
