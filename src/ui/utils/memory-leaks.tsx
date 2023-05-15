import * as React from "react";
import { remoteSubscriber } from "../rempl-subscriber";
import { ExposedToGlobalLeaksState } from "rempl";

interface MemoryLeaksContext {
  breakLeakedObjectRefs: () => void;
  exposeLeakedObjectsToGlobal: () => void;
  cancelExposingLeakedObjectsToGlobal: () => void;
  exposedLeaks: ExposedToGlobalLeaksState;
}

const MemoryLeaksContext = React.createContext<MemoryLeaksContext>({
  breakLeakedObjectRefs: () => undefined,
  exposeLeakedObjectsToGlobal: () => undefined,
  cancelExposingLeakedObjectsToGlobal: () => undefined,
  exposedLeaks: null,
});
export const useMemoryLeaks = () => React.useContext(MemoryLeaksContext);
export function MemoryLeaksContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ns = remoteSubscriber.ns("memory-leaks");
  const [exposedLeaksState, setExposedLeaksState] =
    React.useState<ExposedToGlobalLeaksState>(null);
  const value = React.useMemo<MemoryLeaksContext>(() => {
    return {
      exposedLeaks: exposedLeaksState,
      breakLeakedObjectRefs() {
        ns.callRemote("breakLeakedObjectRefs");
      },
      exposeLeakedObjectsToGlobal() {
        ns.callRemote("exposeLeakedObjectsToGlobal");
      },
      cancelExposingLeakedObjectsToGlobal() {
        ns.callRemote("cancelExposingLeakedObjectsToGlobal");
      },
    };
  }, [exposedLeaksState]);

  React.useEffect(
    () =>
      remoteSubscriber
        .ns("memory-leaks")
        .subscribe(state => setExposedLeaksState(state)),
    []
  );

  return (
    <MemoryLeaksContext.Provider value={value}>
      {children}
    </MemoryLeaksContext.Provider>
  );
}
