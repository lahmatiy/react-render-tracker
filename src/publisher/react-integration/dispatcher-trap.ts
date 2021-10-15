import {
  TransferCallTrace,
  Fiber,
  FiberDispatchCall,
  FiberDispatcherContext,
  FiberRoot,
  ReactContext,
  ReactDispatcherTrapApi,
  ReactInternals,
  RerenderState,
  TransferCallTracePoint,
} from "../types";
import { CoreApi } from "./core";
import { parseStackTraceLine } from "./utils/parse-stack-trace";
import { resolveSourceLoc } from "./utils/resolveSourceLoc";

type Dispatcher = any;
type DispatchFn = (state: any) => any;
type UseContextPathMap = Map<ReactContext<any>, FiberDispatcherContext> & {
  count: number;
};
type FiberDispatcherInfo = {
  contexts: UseContextPathMap | null;
  memos: any[] | null;
};

function extractHookPath() {
  const stack = String(new Error().stack).split("\n").slice(4);
  const path = [];
  const result: TransferCallTrace = {
    path: undefined,
    loc: null,
  };
  let prev: TransferCallTrace | TransferCallTracePoint = result;

  for (const line of stack) {
    const parsed = parseStackTraceLine(line);

    if (!parsed) {
      break;
    }

    prev.loc = resolveSourceLoc(parsed.loc);

    if (!parsed.name.startsWith("use")) {
      break;
    }

    path.unshift(
      (prev = {
        name: parsed.name,
        loc: null,
      })
    );
  }

  if (path.length) {
    result.path = path;
  }

  // console.log(String(new Error().stack).split("\n"));
  // console.log(path);
  return result;
}

export function dispatcherTrap(
  renderer: ReactInternals,
  { isFiberRoot }: CoreApi
): ReactDispatcherTrapApi {
  let currentDispatcher: Dispatcher | null = null;
  let currentFiber: Fiber | null = null;
  let currentRoot: FiberRoot | null = null;
  let currentFiberCollectInfo: FiberDispatcherInfo | null = null;
  let currentEffectFiber: Fiber | null = null;
  let dispatchCalls: FiberDispatchCall[] = [];
  // let currentFiberRerenderState: RerenderState | null = null;
  const fiberInfo = new WeakMap<Fiber, FiberDispatcherInfo>();
  const fiberRoot = new WeakMap<Fiber, FiberRoot>();
  const knownDispatcher = new Set();
  const ignoreDispatcherTransition = new Set();
  const patchedHookFn = new WeakMap<
    DispatchFn,
    { trace: TransferCallTrace; fn: DispatchFn }
  >();
  const rerenderStates = new WeakMap<Fiber, RerenderState[]>();

  function patchEffectHook(hookName: string, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = function (create: any, deps?: any[]) {
      const hookOwnerFiber = currentFiber;
      // const path = trackHookLocation();
      const wrappedCreate = () => {
        currentEffectFiber = hookOwnerFiber;

        const destroy = create();

        currentEffectFiber = null;
        // const fiberId = getOrGenerateFiberId(fiber);

        // recordEvent({
        //   op: "effect-create",
        //   commitId: -1,
        //   fiberId,
        //   path,
        // });

        if (typeof destroy === "function") {
          return () => {
            // recordEvent({
            //   op: "effect-destroy",
            //   commitId: -1,
            //   fiberId,
            //   path,
            // });

            return destroy();
          };
        }

        return destroy;
      };

      return orig(wrappedCreate, deps);
    };
  }

  function patchStateHook(hookName: string, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = (...args: any[]) => {
      const [state, dispatch] = orig(...args);
      dispatch.current = state;

      if (!patchedHookFn.has(dispatch)) {
        const hookOwnerFiber = currentFiber as Fiber;
        const hookOwnerFiberRoot = currentRoot as FiberRoot;

        patchedHookFn.set(dispatch, {
          trace: extractHookPath(),
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
            // console.log(
            //   "dispatch",
            //   hookOwnerFiberId,
            //   currentFiber && getOrGenerateFiberId(currentFiber),
            //   window.event?.type
            // );
            // console.dir(new Error());
            // if (
            //   !currentFiber &&
            //   !currentEffectFiber &&
            //   window.event?.type === "message"
            // ) {
            //   debugger;
            // }

            // if (hookOwnerFiber?.type.name === "A") {
            //   console.log("dispatch", dispatch.current, ...args);
            //   // debugger;
            // }

            dispatchCalls.push({
              root: hookOwnerFiberRoot,
              fiber: hookOwnerFiber,
              renderFiber: currentFiber,
              effectFiber: currentEffectFiber,
              event:
                (!currentFiber && !currentEffectFiber && window.event?.type) ||
                null,
              stack: String(new Error().stack),
            });

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

      if (currentFiberCollectInfo !== null) {
        let currentFiberUseContext = currentFiberCollectInfo.contexts;

        if (currentFiberUseContext === null) {
          currentFiberUseContext = currentFiberCollectInfo.contexts =
            Object.assign(new Map(), { count: 0 });
        }

        const useContextIndex = currentFiberUseContext.count++;
        let contextInfo = currentFiberUseContext.get(context);

        if (contextInfo === undefined) {
          contextInfo = {
            context,
            reads: [],
          };
          currentFiberUseContext.set(context, contextInfo);
        }

        contextInfo.reads.push({
          index: useContextIndex,
          trace: extractHookPath(),
        });
      }

      return value;
    };
  }

  function patchMemoHook(hookName: string, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = (...args: any[]) => {
      const value = orig(...args);

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
      patchMemoHook("useMemo", dispatcher);
      patchMemoHook("useCallback", dispatcher);
      patchEffectHook("useEffect", dispatcher);
      patchEffectHook("useLayoutEffect", dispatcher);
      patchUseContextHook(dispatcher);
    }

    return dispatcher;
  }

  Object.defineProperty(renderer.currentDispatcherRef, "current", {
    get: () => {
      return currentDispatcher;
    },
    set: nextDispatcher => {
      const nextCurrentFiber = renderer.getCurrentFiber();
      const prevDispatcher = currentDispatcher;

      currentDispatcher = patchDispatcher(nextDispatcher);

      // render
      if (nextCurrentFiber !== currentFiber) {
        currentFiber = nextCurrentFiber;
        currentFiberCollectInfo = null;

        if (currentFiber !== null) {
          // collect info on mount only
          if (currentFiber.alternate === null) {
            fiberInfo.set(
              currentFiber,
              (currentFiberCollectInfo = {
                contexts: null,
                memos: null,
              })
            );
          }

          // if (currentFiber.alternate !== null) {
          //   currentFiber.alternate.expirationTime = 0;
          // }

          // if (currentFiber.type?.name === "A") {
          //   if (
          //     "value" in Object.getOwnPropertyDescriptor(currentFiber, "lanes")
          //   ) {
          //     let lanes = currentFiber.lanes;
          //     Object.defineProperty(currentFiber, "lanes", {
          //       get() {
          //         return lanes;
          //       },
          //       set(value) {
          //         console.log("Set lanes", lanes, "->", value);
          //         lanes = value;
          //       },
          //     });
          //   }
          // }

          currentRoot =
            fiberRoot.get(currentFiber) ||
            (currentFiber.alternate !== null &&
              fiberRoot.get(currentFiber.alternate)) ||
            null;

          if (currentRoot === null) {
            let cursor = currentFiber.return;

            while (cursor !== null) {
              const root = fiberRoot.get(currentFiber);

              if (root !== undefined) {
                currentRoot = root;
                break;
              }

              if (isFiberRoot(cursor)) {
                currentRoot = cursor.stateNode as FiberRoot;
                break;
              }

              cursor = cursor.return;
            }

            if (currentRoot !== null) {
              fiberRoot.set(currentFiber, currentRoot);
            }
          }
        }

        // currentFiberRerenderState = null;
        // rerenderStates.delete(currentFiber as Fiber);
      }
      // re-render
      else if (
        currentFiber !== null &&
        !ignoreDispatcherTransition.has(prevDispatcher) &&
        !ignoreDispatcherTransition.has(nextDispatcher)
      ) {
        //   if (currentFiberRerenderState) {
        //     if (rerenderStates.has(currentFiber)) {
        //       rerenderStates.get(currentFiber)?.push(currentFiberRerenderState);
        //     } else {
        //       rerenderStates.set(currentFiber, [currentFiberRerenderState]);
        //     }
        //   }

        // avoid collecting info on re-renders
        currentFiberCollectInfo = null;
      }
    },
  });

  return {
    getDispatchTrace(dispatch: DispatchFn) {
      return patchedHookFn.get(dispatch)?.trace;
    },
    getFiberRerenders(fiber: Fiber) {
      return rerenderStates.get(fiber);
    },
    getFiberContexts(fiber: Fiber) {
      const contexts = (
        fiberInfo.get(fiber) || fiberInfo.get(fiber.alternate as Fiber)
      )?.contexts;

      return contexts ? [...contexts.values()] : undefined;
    },
    flushDispatchCalls(root: FiberRoot) {
      const accepted = [];
      const rejected = [];

      for (const dispatchCall of dispatchCalls) {
        if (dispatchCall.root === root) {
          accepted.push(dispatchCall);
        } else {
          rejected.push(dispatchCall);
        }
      }

      dispatchCalls = rejected;
      // if (true || !accepted.length) {
      //   console.log({
      //     dispatchCalls: dispatchCalls.slice(),
      //     accepted: accepted.slice(),
      //     acceptedT: accepted.map(f => f.fiber.type),
      //     acceptedT2: accepted.map(f => f.fiber.lanes),
      //     root: root.containerInfo?.previousSibling?.innerHTML,
      //   });
      // }

      return accepted;
    },
  };
}
