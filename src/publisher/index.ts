import { Bridge } from "./bridge";
import { installHook } from "./install-hook";
import { publisher } from "./rempl-publisher";

const __win__ = window;

function start() {
  const hook = installHook(__win__);
  const bridge = new Bridge(hook, publisher);

  __win__["__reactRenderTrackerBridge__"] = bridge;
}

start();
