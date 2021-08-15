import * as React from "react";

type IRenderTrigger = {
  type: string;
  value: any;
};
type IRenderInstance = {
  id: string;
  log: (string: string) => void;
  flushTriggers: () => IRenderTrigger[];
  useState: typeof React.useState;
  useContext: typeof React.useContext;
};
type IRenderContext = {
  initInstance: () => IRenderInstance;
};
const RenderContext = React.createContext<IRenderContext>({} as IRenderContext);

export const useRenderContext = () => React.useContext(RenderContext);
export function RenderContextProvider({ log, children }) {
  let seed = 1;
  const hookWrapper = new WeakMap();
  const value: IRenderContext = {
    initInstance() {
      let name = "Anonymous";

      try {
        throw new Error(
          "An error to get a component name from the stack trace"
        );
      } catch (e) {
        if (e.stack) {
          name = String(e.stack)
            .replace(/^Error.*?\n/, "")
            .split("\n")[2]
            .match(/(?:\s*at\s+)?([a-z$_][a-z$_\d]+)/i)[1];
        }
      }

      const id = `${name}#${seed++}`;
      const triggers = [];
      const contexts = new Set();

      return {
        id,
        log(msg?: string) {
          log(msg ? `${id} ${msg}` : id);
        },
        flushTriggers() {
          return triggers.splice(0);
        },
        useState<T>(
          ...args: Parameters<typeof React.useState>
        ): ReturnType<typeof React.useState> {
          const [state, setState] = React.useState<T>(...args);

          if (!hookWrapper.has(setState)) {
            hookWrapper.set(
              setState,
              (...args: Parameters<typeof setState>) => {
                triggers.push({ type: "setState", value: setState });
                return setState(...args);
              }
            );
          }

          return [state, hookWrapper.get(setState)];
        },
        useContext<T>(context: React.Context<T>) {
          const value = React.useContext<T>(context);

          contexts.add(value);

          return value;
        },
      };
    },
  };

  return <RenderContext.Provider value={value} children={children} />;
}

export function useTrackRender(reason: string = "unknown") {
  const context = useRenderContext();
  const instance = React.useRef<IRenderInstance>();

  if (instance.current === undefined) {
    instance.current = context.initInstance();
    reason = "initial";
  }

  if (reason === "unknown") {
    const triggers = new Set([
      ...instance.current.flushTriggers().map(trigger => trigger.type),
    ]);
    if (triggers.size) {
      reason = [...triggers].join(", ");
    }
  }

  instance.current.log(`[render] ${reason}`);
  console.log(`[render] ${instance.current.id} ${reason}`);

  React.useEffect(() => {
    instance.current.log("[mount]");
    return () => instance.current.log("[unmount]");
  }, []);

  return {
    useState: instance.current.useState,
    useContext: instance.current.useContext,
  };
}
