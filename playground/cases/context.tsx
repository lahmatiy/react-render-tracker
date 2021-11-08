import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

export default {
  title: "Context",
  Root,
} as TestCase;

function Root() {
  useTrackRender();

  return (
    <MyContextProvider>
      <HookConsumer />
      <ElementConsumer />
      <MemoPaypassConsumer />
    </MyContextProvider>
  );
}

function HookConsumer() {
  const { useContext } = useTrackRender();
  const contextValue = useContext(MyContext);

  return <Child value={contextValue || "Fail"} />;
}

function ElementConsumer() {
  return (
    <MyContext.Consumer>
      {contextValue => <Child value={contextValue} />}
    </MyContext.Consumer>
  );
}

function Child({ value }: { value: string }) {
  return <>{value || "Fail: no value"}</>;
}

function MemoPaypassConsumer() {
  return <MemoWrapper />;
}

const MemoWrapper = React.memo(function () {
  return <PaypassConsumerTarget />;
});
MemoWrapper.displayName = "MemoWrapper";

function PaypassConsumerTarget() {
  React.useContext(MyContext);
  const { useContext, useState } = useTrackRender();
  const contextValue = useContext(MyContext);
  const [state, setState] = useState(contextValue);

  if (state !== contextValue) {
    setState(contextValue);
  }

  return <Child value={state} />;
}

const MyContext = React.createContext("Fail: waiting for context change");
MyContext.displayName = "MyContext";

function MyContextProvider({ children }: { children?: React.ReactNode }) {
  const { useState } = useTrackRender();
  const [value, setValue] = useState(0);

  React.useEffect(() => {
    if (value < 5) {
      setValue(value + 1);
    }
  }, [value]);

  return (
    <MyContext.Provider
      value={value > 0 ? "OK" + value : "Fail: waiting for context change"}
    >
      {children}
    </MyContext.Provider>
  );
}
