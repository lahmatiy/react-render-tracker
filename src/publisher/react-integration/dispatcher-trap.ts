import {
  TransferCallTrace,
  Fiber,
  FiberDispatchCall,
  FiberRoot,
  ReactContext,
  ReactDispatcherTrapApi,
  ReactInternals,
  RerenderState,
  TransferCallTracePoint,
  HookInfo,
  HookCompute,
  MemoizedState,
} from "../types";
import { CoreApi } from "./core";
import { extractCallLoc, parseStackTraceLine } from "./utils/stackTrace";

type StateHookName = "useState" | "useReducer";
type MemoHookName = "useMemo" | "useCallback";
type EffectHookName = "useEffect" | "useLayoutEffect";
type Dispatcher = {
  useState(...args: any[]): [any, DispatchFn];
  useReducer(...args: any[]): [any, DispatchFn];
  useMemo(cb: () => any, deps?: any[]): any;
  useCallback(cb: () => any, deps?: any[]): () => any;
  useEffect(create: () => any, deps?: any[]): void;
  useLayoutEffect(create: () => any, deps?: any[]): void;
  useContext(context: ReactContext<any>, ...rest: any[]): any;
  readContext(context: ReactContext<any>): any;
};
type DispatchFn = (value: any) => any;
type FiberDispatcherInfo = {
  hooks: HookInfo[];
};

function extractHookPath(depth = 0) {
  const stack = String(new Error().stack)
    .split("\n")
    .slice(4 + depth);
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

    prev.loc = parsed.loc;

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
  { getFiberTypeId, isFiberRoot }: CoreApi
): ReactDispatcherTrapApi {
  let currentDispatcher: Dispatcher | null = null;
  let currentRoot: FiberRoot | null = null;
  let currentFiber: Fiber | null = null;
  let currentFiberCollectInfo: FiberDispatcherInfo | null = null;
  let currentEffectFiber: Fiber | null = null;
  let currentEffectName: "effect" | "layout-effect" | null = null;
  let currentFiberLastHook: MemoizedState | null = null;
  let currentFiberAlternateLastHook: MemoizedState | null = null;
  let currentFiberHookIndex = 0;
  let currentFiberRenderNum = 0;
  let dispatchCalls: FiberDispatchCall[] = [];
  // let currentFiberRerenderState: RerenderState | null = null;
  const knownDispatcher = new Set<Dispatcher>();
  const ignoreDispatcherTransition = new Set<Dispatcher>();
  const fiberTypeInfo = new Map<number, any>();
  const fiberRoot = new WeakMap<Fiber, FiberRoot>();
  const rerenderStates = new WeakMap<Fiber, RerenderState[]>();
  const fiberComputedMemo = new WeakMap<Fiber, HookCompute[]>();
  const patchedHookFn = new WeakMap<
    DispatchFn,
    { hook: number; fn: DispatchFn }
  >();

  function trackUseHook(
    name: string,
    deps: number | null = null,
    context: ReactContext<any> | null = null
  ) {
    if (currentFiberCollectInfo !== null) {
      currentFiberCollectInfo.hooks?.push({
        name,
        deps,
        context,
        trace: extractHookPath(1),
      });
    }

    return currentFiberHookIndex++;
  }

  function getHookState() {
    if (currentFiberLastHook === null) {
      currentFiberLastHook = currentFiber?.memoizedState;
      currentFiberAlternateLastHook =
        currentFiber?.alternate?.memoizedState || null;
    }

    while (currentFiberLastHook?.next) {
      currentFiberLastHook = currentFiberLastHook.next;
      currentFiberAlternateLastHook = currentFiberAlternateLastHook?.next;
    }

    return {
      next: currentFiberLastHook || null,
      prev: currentFiberAlternateLastHook || null,
    };
  }

  function patchMemoHook(hookName: MemoHookName, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = (fn: () => any, deps?: any[]) => {
      const currentFiberHookIndex = trackUseHook(
        hookName,
        (deps && deps.length) || null
      );
      const wrappedFn =
        hookName === "useMemo"
          ? () => {
              computed = true;
              return fn();
            }
          : fn;
      let computed = false;
      const value = orig(wrappedFn, deps);

      if (hookName === "useCallback") {
        computed = value === wrappedFn;
      }

      if (computed && currentFiber !== null) {
        const { prev, next } = getHookState();
        let computes = fiberComputedMemo.get(currentFiber);

        if (computes === undefined) {
          fiberComputedMemo.set(currentFiber, (computes = []));
        }

        computes.push({
          render: currentFiberRenderNum,
          hook: currentFiberHookIndex,
          prev,
          next,
        });
      }

      return value;
    };
  }

  function patchEffectHook(hookName: EffectHookName, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = function (create: any, deps?: any[]) {
      trackUseHook(hookName);

      const hookOwnerFiber = currentFiber;

      // const path = trackHookLocation();
      const wrappedCreate = () => {
        currentEffectFiber = hookOwnerFiber;
        currentEffectName =
          hookName === "useEffect" ? "effect" : "layout-effect";

        const destroy = create();

        currentEffectFiber = null;
        currentEffectName = null;
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

  function patchStateHook(hookName: StateHookName, dispatcher: Dispatcher) {
    const orig = dispatcher[hookName];

    dispatcher[hookName] = (...args: any[]) => {
      const currentFiberHookIndex = trackUseHook(hookName);
      const [state, dispatch] = orig(...args);
      let dispatchWrapper = patchedHookFn.get(dispatch);

      if (dispatchWrapper === undefined) {
        const hookOwnerFiber = currentFiber as Fiber;
        const hookOwnerFiberRoot = currentRoot as FiberRoot;

        dispatchWrapper = {
          hook: currentFiberHookIndex,
          fn: value => {
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

            dispatchCalls.push({
              dispatch,
              dispatchName: hookName === "useState" ? "setState" : "dispatch",
              root: hookOwnerFiberRoot,
              fiber: hookOwnerFiber,
              renderFiber: currentFiber,
              effectFiber: currentEffectFiber,
              effectName: currentEffectName,
              event:
                (!currentFiber && !currentEffectFiber && window.event?.type) ||
                null,
              loc: extractCallLoc(0),
              // stack: String(new Error().stack),
            });

            // console.log("dispatch", new Error().stack, ...args);
            return dispatch(value);
          },
        };

        patchedHookFn.set(dispatch, dispatchWrapper);
      }

      return [state, dispatchWrapper.fn];
    };
  }

  function patchContextHook(dispatcher: Dispatcher) {
    const orig = dispatcher.useContext;
    const hookName = "useContext";

    dispatcher[hookName] = (context: ReactContext<any>, ...args: any[]) => {
      trackUseHook(hookName, null, context);

      const value = orig(context, ...args);

      return value;
    };
  }

  function patchDispatcher(dispatcher: Dispatcher | null) {
    if (dispatcher && !knownDispatcher.has(dispatcher)) {
      knownDispatcher.add(dispatcher);

      // ContextOnlyDispatcher has a single guard function for each hook,
      // detecting it by comparing two random hooks for equality
      if (dispatcher.useReducer === dispatcher.useState) {
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
      patchContextHook(dispatcher);
    }

    return dispatcher;
  }

  Object.defineProperty(renderer.currentDispatcherRef, "current", {
    get() {
      return currentDispatcher;
    },
    set(nextDispatcher: Dispatcher | null) {
      const nextCurrentFiber = renderer.getCurrentFiber();
      const prevDispatcher = currentDispatcher;

      currentDispatcher = patchDispatcher(nextDispatcher);

      // render
      if (nextCurrentFiber !== currentFiber) {
        currentFiber = nextCurrentFiber;
        currentFiberLastHook = null;
        currentFiberAlternateLastHook = null;
        currentFiberCollectInfo = null;
        currentFiberHookIndex = 0;
        currentFiberRenderNum = 0;

        if (currentFiber !== null) {
          const alternate = currentFiber.alternate;

          // collect info on mount only
          if (alternate === null) {
            const fiberTypeId = getFiberTypeId(currentFiber.type);

            if (!fiberTypeInfo.has(fiberTypeId)) {
              fiberTypeInfo.set(
                fiberTypeId,
                (currentFiberCollectInfo = {
                  hooks: [],
                })
              );
            }
          } else {
            // reset stat on update
            fiberComputedMemo.delete(currentFiber);
          }

          let nextCurrentRoot =
            fiberRoot.get(currentFiber) ||
            (alternate !== null && fiberRoot.get(alternate)) ||
            null;

          if (nextCurrentRoot === null) {
            let cursor = currentFiber.return;

            while (cursor !== null) {
              const root = fiberRoot.get(currentFiber);

              if (root !== undefined) {
                nextCurrentRoot = root;
                break;
              }

              if (isFiberRoot(cursor)) {
                nextCurrentRoot = cursor.stateNode as FiberRoot;
                break;
              }

              cursor = cursor.return;
            }

            if (nextCurrentRoot !== null) {
              fiberRoot.set(currentFiber, nextCurrentRoot);
            }
          }

          currentRoot = nextCurrentRoot;
        }

        // currentFiberRerenderState = null;
        // rerenderStates.delete(currentFiber as Fiber);
      }
      // re-render
      else if (
        currentFiber !== null &&
        prevDispatcher !== null &&
        nextDispatcher !== null &&
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
        currentFiberLastHook = null;
        currentFiberAlternateLastHook = null;
        currentFiberHookIndex = 0;
        currentFiberRenderNum++;
      }
    },
  });

  return {
    getDispatchHookIndex(dispatch: DispatchFn) {
      const dispatchWrapper = patchedHookFn.get(dispatch);
      return dispatchWrapper !== undefined ? dispatchWrapper.hook : null;
    },
    getFiberTypeHookInfo(fiberTypeId: number) {
      return fiberTypeInfo.get(fiberTypeId)?.hooks || [];
    },
    getFiberComputes(fiber: Fiber) {
      return fiberComputedMemo.get(fiber) || [];
    },
    getFiberRerenders(fiber: Fiber) {
      return rerenderStates.get(fiber);
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

      return accepted;
    },
  };
}
