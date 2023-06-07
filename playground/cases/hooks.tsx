// @ts-nocheck
import React from "../react";
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
    (_: any, value: any) => value,
    false,
    () => ({
      a: false,
    })
  );

  React.useCallback(() => (isVisible ? setTest : dispatch), [isVisible]);
  React.useMemo(() => [isVisible, test, state], [isVisible, test, state]);

  // if (test !== 555) setTest(555); // TODO: fix it to track

  React.useDebugValue(Date.now());

  React.useRef({ ref: Date.now() });

  React.useEffect(
    function effect() {
      if (!isVisible) {
        setIsVisible(true);
        setTest(333);
        setTimeout(() => setTest(42));
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

  // React 18 hooks
  if (React.useId) {
    React.useId();
    React.useDeferredValue(state);
    const [, startTransition] = React.useTransition();
    const storage = React.useRef<{ a: number } | undefined>();
    const storageTrigger = React.useRef(function () {
      /**/
    });
    React.useSyncExternalStore(
      listener => ((storageTrigger.current = listener), () => undefined),
      () => storage.current || state
    );
    React.useInsertionEffect(() => undefined, []);

    React.useEffect(
      function effect() {
        if (!isVisible) {
          startTransition(() => undefined);
          setTimeout(() => {
            storage.current = { a: 42 };
            storageTrigger.current();
          }, 500);
        }
      },
      [isVisible]
    );
  }

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
