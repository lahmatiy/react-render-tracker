import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Basic nested render",
  Root,
} as TestCase;

function Root() {
  useTrackRender();
  return <Child />;
}

function Child() {
  useTrackRender();
  return <>OK</>;
}
