import React from "../react";
import { TestCase } from "../types";

export default {
  title: "Context",
  Root,
} as TestCase;

function Root() {
  return (
    <MyContextProvider>
      <HookConsumer />
      <ElementConsumer />
      <MemoPaypassConsumer />
    </MyContextProvider>
  );
}

function HookConsumer() {
  const contextValue = React.useContext(MyContext);

  return <Child value={contextValue || "Fail"} />;
}

function ElementConsumer() {
  const memoCallback = React.useCallback(
    contextValue => <Child value={contextValue} />,
    []
  );

  return (
    <>
      <MyContext.Consumer>
        {contextValue => <Child value={contextValue} />}
      </MyContext.Consumer>
      <MyContext.Consumer>{memoCallback}</MyContext.Consumer>
    </>
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
  const contextValue = React.useContext(MyContext);
  const [state, setState] = React.useState(contextValue);

  if (state !== contextValue) {
    setState(contextValue);
  }

  return <Child value={state} />;
}

const MyContext = React.createContext("Fail: waiting for context change");
MyContext.displayName = "MyContext";

function MyContextProvider({ children }: { children?: React.ReactNode }) {
  const [value, setValue] = React.useState(0);

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
