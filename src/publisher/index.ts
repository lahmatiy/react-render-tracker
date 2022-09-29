import { getHost } from "rempl";
import config from "./config";
import { installReactDevtoolsHook } from "./react-devtools-hook";
import {
  publishReactRenderer,
  publishReactUnsupportedRenderer,
} from "./rempl-publisher";
import { attach } from "./react-integration";

installReactDevtoolsHook(
  window,
  (id, renderer) => attach(renderer, publishReactRenderer(id, renderer)),
  publishReactUnsupportedRenderer
);

if (config.inpage) {
  getHost().activate();
}
