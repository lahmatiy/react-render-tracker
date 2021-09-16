import { ReactDispatcherTrapApi, ReactInternals } from "../types";

type Dispatcher = any;
type DispatchFn = (state: any) => any;

function extractHookPath() {
  const stack = String(new Error().stack).split("\n").slice(4);
  const path = [];

  for (const line of stack) {
    const [, hookName] = line.match(/^\s*at\s+(use\S+)/) || [];

    if (!hookName) {
      break;
    }

    path.unshift(hookName);
  }

  // console.log(String(new Error().stack).split("\n"));
  // console.log(path);
  return path.length ? path : undefined;
}

export function dispatcherTrap(
  renderer: ReactInternals
): ReactDispatcherTrapApi {
  let currentDispatcher: Dispatcher | null = null;
  const knownDispatcher = new Set();
  const patchedHookFn = new WeakMap<
    DispatchFn,
    { fn: DispatchFn; path: string[] | undefined }
  >();

  // function patchUseEffect(dispatcher: Dispatcher) {
  //   const orig = dispatcher.useEffect;

  //   dispatcher.useEffect = function (create: any, deps?: any[]) {
  //     const fiber = renderer.getCurrentFiber();
  //     const path = trackHookLocation();
  //     const wrappedCreate = () => {
  //       const destroy = create();
  //       const fiberId = getOrGenerateFiberId(fiber);

  //       recordEvent({
  //         op: "effect-create",
  //         commitId: -1,
  //         fiberId,
  //         path,
  //       });

  //       if (typeof destroy === "function") {
  //         return () => {
  //           recordEvent({
  //             op: "effect-destroy",
  //             commitId: -1,
  //             fiberId,
  //             path,
  //           });

  //           return destroy();
  //         };
  //       }

  //       return destroy;
  //     };

  //     orig(wrappedCreate, deps);
  //   };
  // }

  function patchStateHook(hookName: string, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = function (...args: any[]) {
      const [state, dispatch] = orig(...args);

      if (!patchedHookFn.has(dispatch)) {
        patchedHookFn.set(dispatch, {
          path: extractHookPath(),
          fn: (...args: any[]) => {
            // console.log("dispatch", new Error().stack, ...args);
            return dispatch(...args);
          },
        });
      }

      return [state, patchedHookFn.get(dispatch)?.fn];
    };
  }

  function patchDispatcher(dispatcher: Dispatcher) {
    if (dispatcher && !knownDispatcher.has(dispatcher)) {
      knownDispatcher.add(dispatcher);
      patchStateHook("useState", dispatcher);
      patchStateHook("useReducer", dispatcher);
      // patchUseEffect(dispatcher);
    }

    return dispatcher;
  }

  Object.defineProperty(renderer.currentDispatcherRef, "current", {
    get: () => {
      return currentDispatcher;
    },
    set: value => {
      currentDispatcher = patchDispatcher(value);
    },
  });

  return {
    getHookPath(dispatch: DispatchFn) {
      return patchedHookFn.get(dispatch)?.path;
    },
  };
}
