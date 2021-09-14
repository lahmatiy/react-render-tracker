import { ReactInternals, RecordEventHandler } from "../types";
import { CoreApi } from "./core";

type Dispatcher = any;

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

  // console.log(path);
  return path.length ? path : undefined;
}

export function dispatcherTrap(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler,
  { getFiberIdThrows }: CoreApi
) {
  let currentDispatcher: Dispatcher | null = null;
  const knownDispatcher = new Set();
  const patchedHookFn = new Map();

  function patchUseEffect(dispatcher: Dispatcher) {
    const orig = dispatcher.useEffect;

    dispatcher.useEffect = function (create: any, deps?: any[]) {
      const fiber = renderer.getCurrentFiber();
      const path = extractHookPath();
      const wrappedCreate = () => {
        const destroy = create();
        const fiberId = getFiberIdThrows(fiber);

        recordEvent({
          op: "effect-create",
          commitId: -1,
          fiberId,
          path,
        });

        if (typeof destroy === "function") {
          return () => {
            recordEvent({
              op: "effect-destroy",
              commitId: -1,
              fiberId,
              path,
            });

            return destroy();
          };
        }

        return destroy;
      };

      orig(wrappedCreate, deps);
    };
  }

  function patchUseState(dispatcher: Dispatcher) {
    const orig = dispatcher.useState;

    dispatcher.useState = function (...args: any[]) {
      const [state, setState] = orig(...args);

      if (!patchedHookFn.has(setState)) {
        // console.log("useState", renderer.getCurrentFiber(), new Error().stack);
        patchedHookFn.set(setState, (...ua: any[]) => {
          // console.log("setState", new Error().stack, ...ua);
          return setState(...ua);
        });
      }

      return [state, patchedHookFn.get(setState)];
    };
  }
  function patchDispatcher(dispatcher: Dispatcher) {
    if (dispatcher && !knownDispatcher.has(dispatcher)) {
      knownDispatcher.add(dispatcher);
      patchUseState(dispatcher);
      patchUseEffect(dispatcher);
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
}
