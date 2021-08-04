import { Bridge } from "./bridge";
import { installHook } from "./install-hook";
import { publisher } from "./rempl-publisher";

const __win__ = window;

function start() {
  const hook = installHook(__win__);

  new Bridge(hook, publisher);
}

start();
