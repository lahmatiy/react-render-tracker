import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Class components",
  Root,
} as TestCase;

function Root() {
  const [, setState] = React.useState(0);

  return (
    <>
      <ClassComponent value="OK" />
      <MemoClassComponent value="OK" />
      <ClassComponentWithSetState />
      <ClassComponentWithShouldComponentUpdate />
      <ShouldComponentUpdateChildWrapper />
      <PureComponentWrapper />
      <ClassComponentWithForceUpdate />
      <button onClick={() => setState(Date.now())}>Trigger update</button>
    </>
  );
}

class ClassComponent extends React.Component<{ value: string }> {
  state = { test: 1 };
  render() {
    const { value } = this.props;

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

class PureComponentWrapper extends React.Component {
  private initial = true;
  state = { test: 1 };
  render() {
    if (this.initial) {
      setTimeout(() => this.setState({ test: 1 }));
      setTimeout(() => this.setState({ test: 2 }), 50);
      this.initial = false;
    }

    return <PureComponent value={this.state.test} />;
  }
}

class PureComponent extends React.PureComponent<{ value: number }> {
  private initial = true;
  state = { test: 1 };
  render() {
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
  return <>[{value}]</>;
}
