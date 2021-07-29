import { installHook } from "./hook.js";
import { init } from "./backend.js";

const hook = installHook(window);
init(hook, window);
