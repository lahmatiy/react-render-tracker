import rempl from "rempl";
import config from "./config";
import { installReactDevtoolsHook } from "./react-devtools-hook";
import { recordEvent } from "./rempl-publisher";
import { attach } from "./react-integration";

installReactDevtoolsHook(window, renderer => attach(renderer, recordEvent));

if (config.inpage) {
  const host = rempl.getHost();
  let isActive = config.isactive ?? true

  const toggle = () => {
    isActive = !isActive;
    isActive ? host.deactivate() : host.activate();
  }
  toggle()

  document.addEventListener('keydown', event => {
    if (event.metaKey === true && 
        event.altKey === true &&
        event.code === 'KeyT') {
      toggle()
    }
  })
}
