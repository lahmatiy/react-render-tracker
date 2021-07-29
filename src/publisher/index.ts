import { installHook } from "./install-hook";
import { Store } from "./store";
import { RendererInterface } from "./types";
import { attach } from "./renderer";

interface RendererAttachedParams {
  id: number
  rendererInterface: RendererInterface
}

const win = window;


function start() {
  const hook = installHook(win);
  const store = new Store();

  win["store"] = store;

  hook.sub(
    "renderer-attached",
    ({ rendererInterface }: RendererAttachedParams) => {
      // Now that the Store and the renderer interface are connected,
      // it's time to flush the pending operation codes to the frontend.
      rendererInterface.flushInitialOperations();
    }
  );


  hook.sub("operations", ({ operations }) => {
    try {
      store.parseOperations(operations);
    } catch (e) {
      console.warn(e.message);
    }
  });

  const attachRenderer = (id, renderer) => {
    let rendererInterface = hook.rendererInterfaces.get(id);

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (rendererInterface == null) {
      if (typeof renderer.findFiberByHostInstance === "function") {
        // react-reconciler v16+
        rendererInterface = attach(hook, id, renderer, win) as RendererInterface;
      }

      if (rendererInterface != null) {
        hook.rendererInterfaces.set(id, rendererInterface);
      }
    }

    // Notify the DevTools frontend about new renderers.
    // This includes any that were attached early (via __REACT_DEVTOOLS_ATTACH__).
    if (rendererInterface != null) {
      hook.emit("renderer-attached", {
        id,
        renderer,
        rendererInterface
      });
    } else {
      hook.emit("unsupported-renderer-version", id);
    }
  };


  hook.on("renderer", ({ id, renderer }) => {
    attachRenderer(id, renderer);
  });

  // Connect renderers that have already injected themselves.
  // hook.renderers.forEach((renderer, id) => {
  //   attachRenderer(id, renderer);
  // });
}

start();
