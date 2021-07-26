import * as React from "react";
import { useTrackRender } from "../helpers";
import { TestCase } from "../types";

const MyContext = React.createContext("Fail: waiting for context change");

function Child() {
  const { useContext } = useTrackRender();
  const context = useContext(MyContext);

  return <>{context}</>;
}

function Root() {
  const { useState } = useTrackRender();
  const [value, setValue] = useState(0);

  setTimeout(() => {
    if (value < 2) {
      setValue(value + 1);
    }
  }, 10);

  return (
    <MyContext.Provider
      value={value === 2 ? "OK" : "Fail: waiting for context change"}
    >
      <Child />
    </MyContext.Provider>
  );
}

export default {
  title: "Basic change of context (not finished)",
  Root,
} as TestCase;
