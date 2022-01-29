import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Bailouts",
  Root,
} as TestCase;

function Root() {
  const [state, setState] = React.useState(0);

  React.useEffect(() => {
    if (state < 1) {
      setState(state + 1);
    }
  }, [state]);

  return (
    <>
      <FunctionNewChild />
      <FunctionSameChild />
      <FunctionSameProps />

      <ClassNewChild />
      <ClassSameChild />
      <ClassSameProps />

      <MemoNoPropsBailout />
      <MemoWithPropsBailout value={"test"} />

      <FunctionStateNoChangeBailout />
      <ClassStateNoChangeBailout />
    </>
  );
}

function FunctionNewChild() {
  return <ShouldUpdate value={"test"} />;
}

function FunctionSameChild() {
  const child = React.useMemo(() => <ShouldNotUpdate value={"test"} />, []);

  return child;
}

function FunctionSameProps() {
  const childProps = React.useMemo(() => ({ value: "test" }), []);

  return <ShouldUpdate {...childProps} />;
}

class ClassNewChild extends React.Component {
  render() {
    return <ShouldUpdate value={"test"} />;
  }
}

class ClassSameChild extends React.Component {
  child = null;
  render() {
    if (this.child === null) {
      this.child = <ShouldNotUpdate value={"test"} />;
    }

    return this.child;
  }
}

class ClassSameProps extends React.Component {
  childProps = { value: "test" };
  render() {
    return <ShouldUpdate {...this.childProps} />;
  }
}

const MemoNoPropsBailout = React.memo(function () {
  return <ShouldNotUpdate value={"test"} />;
});
MemoNoPropsBailout.displayName = "MemoNoPropsBailout";

const MemoWithPropsBailout = React.memo(function ({
  value,
}: {
  value: string;
}) {
  return <ShouldNotUpdate value={value} />;
});
MemoWithPropsBailout.displayName = "MemoWithPropsBailout";

const FunctionStateNoChangeBailout = React.memo(function () {
  const [, setState] = React.useState(1);

  React.useEffect(() => {
    setState(2);
    setState(1);
  }, []);

  return <ShouldNotUpdate value={"test"} />;
});
FunctionStateNoChangeBailout.displayName = "FunctionStateNoChangeBailout";

const ClassStateNoChangeBailout = React.memo(
  class ClassStateNoChangeBailout extends React.Component {
    initial = true;
    state = { value: 1 };

    componentDidMount() {
      // debugger;
      this.setState(() => ({ value: 2 }));
      this.setState(() => ({ value: 1 }));
    }

    render() {
      if (this.initial) {
        this.initial = false;
        // setTimeout(() => {
        //   this.setState({ value: 2 });
        //   this.setState({ value: 1 });
        // });
      }

      return <ShouldNotUpdate value={"test"} />;
    }
  }
);
ClassStateNoChangeBailout.displayName = "ClassStateNoChangeBailout";

function ShouldUpdate({ value }: { value: string }) {
  const updateCount = React.useRef(0);
  updateCount.current++;

  return <>[{value !== value || updateCount.current === 1 ? "FAIL" : "OK"}]</>;
}

function ShouldNotUpdate({ value }: { value: string }) {
  const updateCount = React.useRef(0);
  updateCount.current++;

  return <>[{value === value && updateCount.current === 1 ? "OK" : "FAIL"}]</>;
}
