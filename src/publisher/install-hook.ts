import { DevtoolsHook } from "./devtools-hook";

/**
 * React uses hardcoded hook name.
 * {@link packages/react-reconciler/src/ReactFiberDevToolsHook.new.js L:44}
 */
const hookName = "__REACT_DEVTOOLS_GLOBAL_HOOK__";
const MARKER = Symbol();

export function installHook(target: any) {
  const existingHook = target[hookName];

  if (target.hasOwnProperty(hookName)) {
    if (existingHook[MARKER] === MARKER) {
      return existingHook;
    }
  }

  const hook = new DevtoolsHook();

  if (existingHook) {
    for (const key of Object.keys(existingHook)) {
      delete existingHook[key];
    }
    Object.assign(existingHook, hook, { [MARKER]: MARKER });
  } else {
    Object.defineProperty(target, hookName, {
      // This property needs to be configurable for the test environment,
      // else we won't be able to delete and recreate it between tests.
      configurable: true,
      enumerable: false,
      get() {
        return hook;
      },
    });
  }

  return target[hookName];
}
