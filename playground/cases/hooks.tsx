import * as React from "react";
import { TestCase } from "../types";

export default {
  title: "Hooks",
  Root,
} as TestCase;

const CtxA = React.createContext(1);
const CtxB = React.createContext(2);

function Root() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [test, setTest] = React.useState(0);
  const [state, dispatch] = React.useReducer(
    (_, value) => value,
    false,
    () => ({
      a: false,
    })
  );

  React.useCallback(() => (isVisible ? setTest : dispatch), [isVisible]);
  React.useMemo(() => [isVisible, test, state], [isVisible, test, state]);

  React.useDebugValue(Date.now());

  React.useRef({ ref: Date.now() });

  React.useEffect(
    function effect() {
      if (!isVisible) {
        setIsVisible(true);
        setTest(333);
        dispatch({ a: 1 });
      }

      return function teardown() {
        /*noop*/
      };
    },
    [isVisible]
  );
  React.useLayoutEffect(
    function layoutEffect() {
      return function teardown() {
        /*noop*/
      };
    },
    [isVisible]
  );

  React.useContext(CtxA);
  React.useContext(CtxB);

  useFoo();

  return <Child prop={42} />;
}

function useFoo() {
  return useBar();
}

function useBar() {
  return React.useContext(CtxA);
}

const Child = React.forwardRef(function Child(
  { prop = 123 }: { prop: number },
  ref
) {
  React.useImperativeHandle(
    ref,
    () => ({
      focus() {
        console.log();
      },
    }),
    [prop]
  );

  return <>OK</>;
});
