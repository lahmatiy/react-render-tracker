import {
  Fiber,
  ReactContext,
  ReactDispatcherTrapApi,
  ReactInternals,
  RerenderState,
} from "../types";

type Dispatcher = any;
type DispatchFn = (state: any) => any;
type UseContextPathMap = Map<
  ReactContext<any>,
  Map<number, { path: string[] | undefined }>
> & { count: number };

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
  let currentFiberTrackUseContext = false;
  let currentFiberUseContext: UseContextPathMap | null = null;
  // let currentFiberRerenderState: RerenderState | null = null;
  const knownDispatcher = new Set();
  const ignoreDispatcherTransition = new Set();
  const patchedHookFn = new WeakMap<
    DispatchFn,
    { fn: DispatchFn; path: string[] | undefined }
  >();
  const useContextPaths = new WeakMap<Fiber, UseContextPathMap>();
  const rerenderStates = new WeakMap<Fiber, RerenderState[]>();

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
        // const hookOwnerFiber = currentFiber;
        patchedHookFn.set(dispatch, {
          path: extractHookPath(),
          fn: (...args: any[]) => {
            // if (
            //   !currentFiberRerenderState &&
            //   currentFiber !== null &&
            //   (currentFiber === hookOwnerFiber ||
            //     currentFiber?.alternate === hookOwnerFiber)
            // ) {
            //   currentFiberRerenderState = {
            //     state: currentFiber.memoizedState,
            //   };
            // }
            // console.log(hookName, currentFiberRerenderState);

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

      if (currentFiberTrackUseContext) {
        if (currentFiberUseContext === null) {
          currentFiberUseContext = Object.assign(new Map(), { count: 0 });
          useContextPaths.set(currentFiber as Fiber, currentFiberUseContext);
        }

        let contextPaths = currentFiberUseContext.get(context);

        if (contextPaths === undefined) {
          contextPaths = new Map();
          currentFiberUseContext.set(context, contextPaths);
        }

        contextPaths.set(currentFiberUseContext.count++, {
          path: extractHookPath(),
        });
      }

      return value;
    };
  }

  function patchDispatcher(dispatcher: Dispatcher) {
    if (dispatcher && !knownDispatcher.has(dispatcher)) {
      knownDispatcher.add(dispatcher);

      // ContextOnlyDispatcher has a single guard function for each hook,
      // detecting it by comparing two random hooks for equality
      if (dispatcher.useMemo === dispatcher.useState) {
        ignoreDispatcherTransition.add(dispatcher);
      }
      // In dev mode InvalidNestedHooksDispatcher* are used, that's the only
      // dispatchers which is changing current dispatcher for another InvalidNestedHooksDispatcher.
      // Detecting such dispatchers by testing a source of the readContext() method
      // which has just a single additional call for warnInvalidContextAccess().
      // We can't rely on a function name since it can be mangled.
      else if (
        /warnInvalidContextAccess\(\)/.test(dispatcher.readContext.toString())
      ) {
        ignoreDispatcherTransition.add(dispatcher);
      }

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
    set: nextDispatcher => {
      const nextCurrentFiber = renderer.getCurrentFiber();
      // const prevDispatcher = currentDispatcher;

      currentDispatcher = patchDispatcher(nextDispatcher);

      // render
      if (nextCurrentFiber !== currentFiber) {
        currentFiber = nextCurrentFiber;

        // track contexts on mount only
        currentFiberTrackUseContext =
          currentFiber !== null && currentFiber.alternate === null;
        currentFiberUseContext = null;
        // currentFiberRerenderState = null;
        // rerenderStates.delete(currentFiber as Fiber);
      }
      // re-render
      // else if (
      //   currentFiber !== null &&
      //   !ignoreDispatcherTransition.has(prevDispatcher) &&
      //   !ignoreDispatcherTransition.has(nextDispatcher)
      // ) {
      //   if (currentFiberRerenderState) {
      //     if (rerenderStates.has(currentFiber)) {
      //       rerenderStates.get(currentFiber)?.push(currentFiberRerenderState);
      //     } else {
      //       rerenderStates.set(currentFiber, [currentFiberRerenderState]);
      //     }
      //   }

      //   currentFiberTrackUseContext = false;
      //   currentFiberUseContext = null;
      //   currentFiberRerenderState = null;
      // }
    },
  });

  return {
    getHookPath(dispatch: DispatchFn) {
      return patchedHookFn.get(dispatch)?.path;
    },
    getFiberRerenders(fiber: Fiber) {
      return rerenderStates.get(fiber);
    },
    getFiberUseContextPaths(fiber: Fiber, context: ReactContext<any>) {
      const contextPaths = (
        useContextPaths.get(fiber) ||
        useContextPaths.get(fiber.alternate as Fiber)
      )?.get(context);

      return contextPaths ? [...contextPaths.values()] : undefined;
    },
  };
}
