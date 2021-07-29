import { DevtoolsHook } from "../devtools-hook";
import { ReactRenderer, RendererInterface } from "../types";
import { attach } from "../renderer";
import { parseOperations } from "./parse-operations";

const __win__ = window;

interface RendererAttachedParams {
  id: number;
  rendererInterface: RendererInterface;
}

type Publisher = any;

type Unsubscribe = () => void;

/**
 * A bridge between devtools hook and tracker tool ui.
 * Transfers profiling data and react tree changes to the tracker tool ui.
 */
export class Bridge {
  private readonly subscriptions: Unsubscribe[];

  constructor(private devtools: DevtoolsHook, private publisher: Publisher) {
    this.subscriptions = [
      devtools.sub(
        "renderer-attached",
        ({ rendererInterface }: RendererAttachedParams) => {
          // Now that the Store and the renderer interface are connected,
          // it's time to flush the pending operation codes to the frontend.
          rendererInterface.flushInitialOperations();
        }
      ),
      devtools.sub("operations", ({ operations }) => {
        try {
          const payload = parseOperations(operations);
          console.log("publish!", { payload });
          this.publisher.ns("tree-changes").publish(payload);
        } catch (e) {
          console.warn(e.message);
        }
      }),
      devtools.sub("renderer", ({ id, renderer }) => {
        this.attachRenderer(id, renderer);
      }),
    ];
  }

  public destroy() {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
  }

  private attachRenderer(id: number, renderer: ReactRenderer) {
    let rendererInterface = this.devtools.rendererInterfaces.get(id);

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (rendererInterface == null) {
      if (typeof renderer.findFiberByHostInstance === "function") {
        // react-reconciler v16+
        rendererInterface = attach(
          this.devtools,
          id,
          renderer,
          __win__
        ) as RendererInterface;
      }

      if (rendererInterface != null) {
        this.devtools.rendererInterfaces.set(id, rendererInterface);
      }
    }

    // Notify the DevTools frontend about new renderers.
    // This includes any that were attached early (via __REACT_DEVTOOLS_ATTACH__).
    if (rendererInterface != null) {
      this.devtools.emit("renderer-attached", {
        id,
        renderer,
        rendererInterface,
      });
    } else {
      this.devtools.emit("unsupported-renderer-version", id);
    }
  }
}
