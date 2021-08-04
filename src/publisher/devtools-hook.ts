import { RendererInterface, ReactRenderer } from "./types";

type Fiber = any;
type FiberRoot = any;

type EventHandler<TData = any> = (data: TData) => void;

/**
 * {@link packages/react-devtools-shared/src/hook.js}
 */
export class DevtoolsHook {
  /**
   * This is a legacy flag.
   * React v16 checks the hook for this to ensure DevTools is new enough.
   */
  public readonly supportsFiber = true;

  /**
   * Fast Refresh for web relies on this
   */
  public renderers = new Map<number, ReactRenderer>();
  public rendererInterfaces = new Map<number, RendererInterface>();

  private hasDetectedBadDCE = false;
  private uidCounter = 0;
  private fiberRoots = {};
  private listeners: { [key: string]: EventHandler[] } = {};

  sub = (event: string, fn: EventHandler) => {
    this.on(event, fn);
    return () => this.off(event, fn);
  };

  on = (event: string, fn: EventHandler) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(fn);
  };

  off = (event: string, fn: EventHandler) => {
    if (!this.listeners[event]) {
      return;
    }

    const index = this.listeners[event].indexOf(fn);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }

    if (!this.listeners[event].length) {
      delete this.listeners[event];
    }
  };

  emit = (event: string, data: unknown) => {
    if (this.listeners[event]) {
      this.listeners[event].map(fn => fn(data));
    }
  };

  /**
   * React calls this method
   */
  inject = (renderer: ReactRenderer) => {
    const id = ++this.uidCounter;
    this.renderers.set(id, renderer);

    this.emit("renderer", { id, renderer });

    return id;
  };

  public getFiberRoots = (rendererID: number) => {
    const roots = this.fiberRoots;
    if (!roots[rendererID]) {
      roots[rendererID] = new Set();
    }

    return roots[rendererID];
  };

  /**
   * React calls this method
   */
  onCommitFiberUnmount = (rendererID: number, fiber: Fiber) => {
    const rendererInterface = this.rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handleCommitFiberUnmount(fiber);
    }
  };

  /**
   * React calls this method
   */
  onCommitFiberRoot = (
    rendererId: number,
    root: FiberRoot,
    priorityLevel: any
  ) => {
    const mountedRoots = this.getFiberRoots(rendererId);
    const current = root.current;
    const isKnownRoot = mountedRoots.has(root);
    const isUnmounting =
      current.memoizedState == null || current.memoizedState.element == null;

    // Keep track of mounted roots so we can hydrate when DevTools connect.
    if (!isKnownRoot && !isUnmounting) {
      mountedRoots.add(root);
    } else if (isKnownRoot && isUnmounting) {
      mountedRoots.delete(root);
    }
    const rendererInterface = this.rendererInterfaces.get(rendererId);
    if (rendererInterface != null) {
      rendererInterface.handleCommitFiberRoot(root, priorityLevel);
    }
  };

  /**
   * React calls this method
   */
  onPostCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
    const rendererInterface = this.rendererInterfaces.get(rendererID);
    if (rendererInterface != null) {
      rendererInterface.handlePostCommitFiberRoot(root);
    }
  };
}
