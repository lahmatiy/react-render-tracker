import { DevtoolsHook } from "../devtools-hook";
import {
  Element,
  ReactRenderer,
  RendererInterface,
  Message,
  ReactCommitData,
} from "../types";
import { attach } from "../renderer";
import { parseOperations } from "./parse-operations";
import { parseCommitChanges } from "./parse-commit-changes";

const __win__ = window;

interface RendererAttachedParams {
  id: number;
  rendererInterface: RendererInterface;
}

interface Publisher {
  ns(channel: string): {
    publish(data: Message[]);
  };
}

type Unsubscribe = () => void;

/**
 * A bridge between devtools hook and tracker tool ui.
 * Transfers profiling data and react tree changes to the tracker tool ui.
 */
export class Bridge {
  private readonly subscriptions: Unsubscribe[];

  private messages: Message[] = [];

  constructor(private devtools: DevtoolsHook, private publisher: Publisher) {
    const seenChanges = new WeakSet();
    const idToElement = new Map<number, Element>();

    this.subscriptions = [
      devtools.sub("operations", operations => {
        this.publish(parseOperations(operations, idToElement));
      }),
      devtools.sub("commit", (data: ReactCommitData) => {
        this.publish(parseCommitChanges(data, seenChanges));
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

  private publish(messages: Message[]) {
    if (!messages || !messages.length) {
      return;
    }

    this.messages.push(...messages);
    // console.log("react-render-tracker", this.messages.length);
    // window.__tool = this.messages;
    this.publisher.ns("tree-changes").publish(this.messages);
  }

  private attachRenderer(id: number, renderer: ReactRenderer) {
    let rendererInterface = this.devtools.rendererInterfaces.get(id) || null;

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (rendererInterface === null) {
      if (typeof renderer.findFiberByHostInstance === "function") {
        // react-reconciler v16+
        rendererInterface = attach(
          this.devtools,
          id,
          renderer
        ) as RendererInterface;

        this.devtools.rendererInterfaces.set(id, rendererInterface);
      }
    }

    if (rendererInterface === null) {
      this.devtools.emit("unsupported-renderer-version", id);
    }
  }
}
