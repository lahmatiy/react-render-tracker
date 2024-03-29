import { getHost } from "rempl";
import config from "./config";
import { installReactDevtoolsHook } from "./react-devtools-hook";
import {
  publishReactRenderer,
  publishReactUnsupportedRenderer,
  remoteCommands,
} from "./rempl-publisher";
import { attach } from "./react-integration";

export const hook = installReactDevtoolsHook(
  window,
  (id, renderer) =>
    attach(renderer, publishReactRenderer(id, renderer), remoteCommands),
  publishReactUnsupportedRenderer
);

if (config.inpage) {
  getHost().activate();
}
