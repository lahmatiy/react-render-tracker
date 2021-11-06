import * as React from "react";
import {
  IRenderContext,
  IRenderInstance,
  RenderContext,
  useTrackRender,
} from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Class components",
  Root,
} as TestCase;

function Root() {
  const { useState } = useTrackRender();
  const [, setState] = useState(0);

  return (
    <>
      <ClassComponent value="OK" />
      <MemoClassComponent value="OK" />
      <ClassComponentWithSetState />
      <ClassComponentWithShouldComponentUpdate />
      <ShouldComponentUpdateChildWrapper />
      <PureComponent />
      <ClassComponentWithForceUpdate />
      <button onClick={() => setState(Date.now())}>Trigger update</button>
    </>
  );
}

class ClassComponent extends React.Component<{ value: string }> {
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

class ClassComponentWithSetState extends React.Component {
  private initial = true;
  state = { test: false };
  render() {
    if (this.initial) {
      setTimeout(() => this.setState({ test: true }));
      this.initial = false;
    }

    return <Child value={this.state.test ? "OK" : "FAIL"} />;
  }
}

class ClassComponentWithShouldComponentUpdate extends React.Component {
  private initial = true;
  state = { test: false };
  shouldComponentUpdate() {
    return false;
  }
  render() {
    if (this.initial) {
      setTimeout(() => this.setState({ test: true }));
      this.initial = false;
    }

    return <Child value={this.state.test ? "FAIL" : "OK"} />;
  }
}

class ShouldComponentUpdateChildWrapper extends React.Component {
  private initial = true;
  state = { test: false, update: 1 };
  render() {
    if (this.initial) {
      setTimeout(() => this.setState({ test: true, update: 2 }));
      setTimeout(() => this.setState({ test: true, update: 3 }), 5);
      setTimeout(() => this.setState({ test: true, update: 4 }), 10);
      this.initial = false;
    }

    return (
      <ShouldComponentUpdateChild
        update={this.state.update}
        value={this.state.test ? "OK" : "FAIL"}
      />
    );
  }
}

class ShouldComponentUpdateChild extends React.Component<{
  update: number;
  value: string;
}> {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }
  render() {
    const { value } = this.props;
    return <Child value={value} />;
  }
}

class PureComponent extends React.PureComponent {
  private initial = true;
  state = { test: 1 };
  render() {
    // debugger;
    if (this.initial) {
      setTimeout(() => this.setState({ test: 2 }));
      setTimeout(() => this.setState({ test: 3 }), 5);
      setTimeout(() => this.setState({ test: 3 }), 10);
      this.initial = false;
    }

    return <ChildPureComponent value={this.state.test !== 3 ? "FAIL" : "OK"} />;
  }
}

class ChildPureComponent extends React.PureComponent<{
  value: string;
}> {
  render() {
    const { value } = this.props;

    return <Child value={value} />;
  }
}

class ClassComponentWithForceUpdate extends React.Component {
  private initial = true;
  forceUpdate() {
    super.forceUpdate();
  }
  render() {
    const initial = this.initial;
    // debugger;
    if (this.initial) {
      setTimeout(() => this.forceUpdate());
      this.initial = false;
    }

    return <Child value={!initial ? "OK" : "FAIL"} />;
  }
}

const MemoClassComponent = React.memo(ClassComponent);

function Child({ value }: { value: string }) {
  useTrackRender();
  return <>[{value}]</>;
}
