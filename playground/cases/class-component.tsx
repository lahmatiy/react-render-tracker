import * as React from "react";
import {
  IRenderContext,
  IRenderInstance,
  RenderContext,
  useTrackRender,
} from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Using class component",
  Root,
} as TestCase;

function Root() {
  const { useState } = useTrackRender();
  const [, setState] = useState(0);

  return (
    <>
      <ClassComponentWrapper value="O" />
      <MemoClassComponentWrapper value="K" />
      <button onClick={() => setState(Date.now())}>Trigger update</button>
    </>
  );
}

class ClassComponentWrapper extends React.Component<{ value: string }> {
  static contextType = RenderContext;
  private renderContextInstance?: IRenderInstance;
  private initial = true;
  state = { test: 1 };
  render() {
    const renderContext: IRenderContext = this.context;
    const { value } = this.props;

    if (!this.renderContextInstance) {
      this.renderContextInstance = renderContext.initInstance();
    }

    this.renderContextInstance.log(
      `[render] ${this.initial ? "initial" : "rerender"}`
    );
    this.initial = false;

    return <Child value={value} />;
  }
}

const MemoClassComponentWrapper = React.memo(ClassComponentWrapper);

function Child({ value }: { value: string }) {
  useTrackRender();
  return <>{value}</>;
}
