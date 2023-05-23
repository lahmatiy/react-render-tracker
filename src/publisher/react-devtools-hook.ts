import { isUnsupportedRenderer } from "./utils/renderer-info";
import {
  ReactIntegrationApi,
  ReactInternals,
  ReactUnsupportedRendererInfo,
  Fiber,
  FiberRoot,
} from "./types";

type ReactDevtoolsHook = {
  supportsFiber: boolean;
  inject: (renderer: ReactInternals) => number;
  // onScheduleRoot(rendererId: number, root: FiberRoot, children: any[]) {},
  onCommitFiberUnmount: (rendererId: number, fiber: Fiber) => void;
  onCommitFiberRoot: (
    rendererId: number,
    root: FiberRoot,
    priorityLevel: any
  ) => void;
  onPostCommitFiberRoot: (rendererId: number, root: FiberRoot) => void;

  // Not used. It is declared to follow React Devtools hook's behaviour
  // in order for other tools like react-render to work
  renderers?: Map<any, any>;
};

export function createReactDevtoolsHook(
  attachRenderer: (id: number, renderer: ReactInternals) => ReactIntegrationApi,
  onUnsupportedRenderer: (rendererInfo: ReactUnsupportedRendererInfo) => void,
  existing: ReactDevtoolsHook
) {
  const attachedIntegrations = new Map<number, ReactIntegrationApi>();
  let rendererSeedId = 0;

  // Not used. It is declared to follow React Devtools hook's behaviour
  // in order for other tools like react-render to work
  const renderers = new Map<number, ReactInternals>();

  const reactDevtoolsHook: ReactDevtoolsHook = {
    // This is a legacy flag.
    // React v16 checks the hook for this to ensure DevTools is new enough.
    supportsFiber: true,

    // Not used. It is declared to follow React Devtools hook's behaviour
    // in order for other tools like react-refresh to work
    // see https://github.com/facebook/react/blob/4ff5f5719b348d9d8db14aaa49a48532defb4ab7/packages/react-refresh/src/ReactFreshRuntime.js#L509
    renderers,

    inject(renderer) {
      let id = ++rendererSeedId;

      if (typeof existing.inject === "function") {
        id = existing.inject(renderer);
      } else {
        // Follow React Devtools hook's behaviour in order for other tools
        // like react-refresh to work
        renderers.set(id, renderer);
      }

      const unsupportedRender = isUnsupportedRenderer(renderer);
      if (unsupportedRender) {
        console.warn(
          `[react-render-tracker] ${unsupportedRender.reason}`,
          unsupportedRender.info
        );
        onUnsupportedRenderer({
          id,
          ...unsupportedRender.info,
          reason: unsupportedRender.reason,
        });
      } else {
        if (attachedIntegrations.size === 0) {
          attachedIntegrations.set(id, attachRenderer(id, renderer));
        } else {
          console.warn(
            `[react-render-tracker] Only one React instance per page is supported for now, but one more React instance (${renderer.rendererPackageName} v${renderer.version}) was detected`
          );
        }
      }

      return id;
    },

    // onScheduleRoot(rendererId, root, children) {},

    onCommitFiberUnmount(rendererId, fiber) {
      if (typeof existing.onCommitFiberUnmount === "function") {
        existing.onCommitFiberUnmount(rendererId, fiber);
      }

      const integration = attachedIntegrations.get(rendererId);

      if (integration) {
        try {
          // console.log("handleCommitFiberUnmount");
          integration.handleCommitFiberUnmount(fiber);
        } catch (e) {
          console.error("[react-render-tracker]", e);
          // debugger;
        }
      }
    },

    onCommitFiberRoot(rendererId, root, priorityLevel) {
      if (typeof existing.onCommitFiberRoot === "function") {
        existing.onCommitFiberRoot(rendererId, root, priorityLevel);
      }

      const integration = attachedIntegrations.get(rendererId);

      if (integration) {
        try {
          // console.log("handleCommitFiberRoot");
          integration.handleCommitFiberRoot(root, priorityLevel);
        } catch (e) {
          console.error("[react-render-tracker]", e);
          // debugger;
        }
      }
    },

    /**
     * React calls this method
     */
    onPostCommitFiberRoot(rendererId, root) {
      if (typeof existing.onPostCommitFiberRoot === "function") {
        existing.onPostCommitFiberRoot(rendererId, root);
      }

      const integration = attachedIntegrations.get(rendererId);

      if (integration) {
        try {
          // console.log("handlePostCommitFiberRoot");
          integration.handlePostCommitFiberRoot(root);
        } catch (e) {
          console.error("[react-render-tracker]", e);
          // debugger;
        }
      }
    },
  };

  return reactDevtoolsHook;
}

// React uses hardcoded hook name
const hookName = "__REACT_DEVTOOLS_GLOBAL_HOOK__";
const MARKER = Symbol();

export function installReactDevtoolsHook(
  target: any,
  attachRenderer: (id: number, renderer: ReactInternals) => ReactIntegrationApi,
  onUnsupportedRenderer: (rendererInfo: ReactUnsupportedRendererInfo) => void
) {
  const existingHook = target[hookName];

  if (target.hasOwnProperty(hookName)) {
    if (existingHook[MARKER] === MARKER) {
      return existingHook;
    }
  }

  const hook = createReactDevtoolsHook(attachRenderer, onUnsupportedRenderer, {
    ...existingHook,
  });

  if (existingHook) {
    existingHook[MARKER] = MARKER;

    for (const [key, value] of Object.entries(hook)) {
      if (typeof value === "function") {
        delete existingHook[key];
        existingHook[key] = value;
      }
    }
  } else {
    Object.defineProperty(target, hookName, {
      configurable: false,
      enumerable: false,
      get() {
        return hook;
      },
    });
  }

  return target[hookName];
}
