import { installReactDevtoolsHook } from "./react-devtools-hook";
import { recordEvent } from "./rempl-publisher";
import { attach } from "./renderer";

installReactDevtoolsHook(window, renderer => attach(renderer, recordEvent));
