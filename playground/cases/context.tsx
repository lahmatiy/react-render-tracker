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

const MyContext = React.createContext("Fail: waiting for context change");
MyContext.displayName = "MyContext";

function MyContextProvider({ children }: { children?: React.ReactNode }) {
  const { useState } = useTrackRender();
  const [value, setValue] = useState(0);

  React.useEffect(() => {
    if (value < 2) {
      setValue(value + 1);
    }
  }, [value]);

  return (
    <MyContext.Provider
      value={value > 0 ? "OK" : "Fail: waiting for context change"}
    >
      {children}
    </MyContext.Provider>
  );
}
