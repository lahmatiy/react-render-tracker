import { DevtoolsHook } from "./devtools-hook";

/**
 * React uses hardcoded hook name.
 * {@link packages/react-reconciler/src/ReactFiberDevToolsHook.new.js L:44}
 */
const hookName = "__REACT_DEVTOOLS_GLOBAL_HOOK__";

export function installHook(target) {
  if (target.hasOwnProperty(hookName)) {
    return null;
  }

  const hook = new DevtoolsHook();

  Object.defineProperty(target, hookName, {
    // This property needs to be configurable for the test environment,
    // else we won't be able to delete and recreate it between tests.
    configurable: true,
    enumerable: false,
    get() {
      return hook;
    }
  });

  return hook;
}
