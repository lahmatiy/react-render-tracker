import {
  Fiber,
  ReactContext,
  ReactDispatcherTrapApi,
  ReactInternals,
} from "../types";

type Dispatcher = any;
type DispatchFn = (state: any) => any;
type UseContextPathMap = Map<
  ReactContext<any>,
  Map<number, { path: string[] | undefined }>
>;

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
  let currentFiber: Fiber | null = null;
  let currentUseContext: UseContextPathMap | null = null;
  let useContextCallIndex = 0;
  const knownDispatcher = new Set();
  const patchedHookFn = new WeakMap<
    DispatchFn,
    { fn: DispatchFn; path: string[] | undefined }
  >();
  const useContextPaths = new WeakMap<Fiber, UseContextPathMap>();

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

    dispatcher[hookName] = (...args: any[]) => {
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

  function patchUseContextHook(dispatcher: Dispatcher) {
    const orig = dispatcher.useContext;

    dispatcher.useContext = (context: ReactContext<any>, ...args: any[]) => {
      const value = orig(context, ...args);

      if (currentUseContext === null) {
        if (useContextPaths.has(currentFiber as Fiber)) {
          currentUseContext = useContextPaths.get(
            currentFiber as Fiber
          ) as UseContextPathMap;
        } else {
          currentUseContext = new Map();
          useContextPaths.set(currentFiber as Fiber, currentUseContext);
        }
      }

      let contextPaths = currentUseContext.get(context);

      if (!contextPaths) {
        contextPaths = new Map();
        currentUseContext.set(context, contextPaths);
      }

      if (!contextPaths.has(useContextCallIndex)) {
        contextPaths.set(useContextCallIndex, {
          path: extractHookPath(),
        });
      }

      useContextCallIndex++;

      return value;
    };
  }

  function patchDispatcher(dispatcher: Dispatcher) {
    if (dispatcher && !knownDispatcher.has(dispatcher)) {
      knownDispatcher.add(dispatcher);
      patchStateHook("useState", dispatcher);
      patchStateHook("useReducer", dispatcher);
      patchUseContextHook(dispatcher);
      // patchUseEffect(dispatcher);
    }

    return dispatcher;
  }

  Object.defineProperty(renderer.currentDispatcherRef, "current", {
    get: () => {
      return currentDispatcher;
    },
    set: value => {
      currentFiber = renderer.getCurrentFiber();
      useContextCallIndex = 0;
      currentUseContext = null;
      currentDispatcher = patchDispatcher(value);
    },
  });

  return {
    getHookPath(dispatch: DispatchFn) {
      return patchedHookFn.get(dispatch)?.path;
    },
    getFiberUseContextPaths(fiber: Fiber, context: ReactContext<any>) {
      const contextPaths = useContextPaths.get(fiber)?.get(context);
      return contextPaths ? [...contextPaths.values()] : undefined;
    },
  };
}
