import { getHost } from "rempl";
import config from "./config";
import { installReactDevtoolsHook } from "./react-devtools-hook";
import { publishReactInstance } from "./rempl-publisher";
import { attach } from "./react-integration";

installReactDevtoolsHook(window, (id, renderer) =>
  attach(renderer, publishReactInstance(id, renderer))
);

if (config.inpage) {
  getHost().activate();
}
