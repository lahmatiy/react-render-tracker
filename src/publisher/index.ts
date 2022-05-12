import { getHost } from "rempl";
import config from "./config";
import { installReactDevtoolsHook } from "./react-devtools-hook";
import { recordEvent } from "./rempl-publisher";
import { attach } from "./react-integration";

installReactDevtoolsHook(window, renderer => attach(renderer, recordEvent));

if (config.inpage) {
  getHost().activate();
}
