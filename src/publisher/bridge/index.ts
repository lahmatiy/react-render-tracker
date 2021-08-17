import { DevtoolsHook } from "../devtools-hook";
import { ReactRenderer, RendererInterface, Message } from "../types";
import { attach } from "../renderer";
import {
  BaseMessage,
  UnmountElementMessage,
  MountElementMessage,
  RenderElementMessage,
} from "../../common/types";

interface Publisher {
  ns(channel: string): {
    publish(data: Message[]);
  };
}

type Unsubscribe = () => void;
type DistributiveOmit<T, K extends keyof T> = T extends any
  ? Omit<T, K>
  : never;

const getTimestamp =
  typeof performance === "object" &&
  typeof performance.now === "function" &&
  typeof performance.timeOrigin === "number"
    ? () => performance.timeOrigin + performance.now()
    : () => Date.now();

/**
 * A bridge between devtools hook and tracker tool ui.
 * Transfers profiling data and react tree changes to the tracker tool ui.
 */

export class Bridge {
  private readonly subscriptions: Unsubscribe[];

  private events: Message[] = [];
  private eventIdSeed: number = 0;

  constructor(private devtools: DevtoolsHook, private publisher: Publisher) {
    this.subscriptions = [
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

  public recordEvent(payload: DistributiveOmit<Message, "id" | "timestamp">) {
    this.events.push({
      id: this.eventIdSeed++,
      timestamp: getTimestamp(),
      ...payload,
    });
    this.publisher.ns("tree-changes").publish(this.events);
  }

  private attachRenderer(id: number, renderer: ReactRenderer) {
    let rendererInterface = this.devtools.rendererInterfaces.get(id) || null;

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (rendererInterface === null) {
      if (typeof renderer.findFiberByHostInstance === "function") {
        // react-reconciler v16+
        rendererInterface = attach(
          this,
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
