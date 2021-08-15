import { useCallback, useState } from "react";
import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

class ClassComponentWrapper extends React.Component {
  render() {
    return <Child />;
  }
}

function Child() {
  useTrackRender();
  return <>OK</>;
}

function Root() {
  useTrackRender();
  return <ClassComponentWrapper />;
}

export default {
  title: "Using class component",
  Root,
} as TestCase;
