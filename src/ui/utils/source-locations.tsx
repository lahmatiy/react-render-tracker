import * as React from "react";
import * as ReactDOM from "react-dom";
import { remoteSubscriber } from "../rempl-subscriber";
import { SubscribeMap, useSubscription } from "./subscription";

interface SourceLocationsContext {
  subscribe: (loc: string, fn: (resolved: string) => void) => () => void;
  resolvedLocation: (loc?: string | null) => string | null;
}

const SourceLocationsContext = React.createContext<SourceLocationsContext>({
  subscribe: () => () => undefined,
  resolvedLocation: () => null,
});
export const useSourceLocations = () =>
  React.useContext(SourceLocationsContext);
export function SourceLocationsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = React.useMemo<SourceLocationsContext>(() => {
    const resolvedLocations = new SubscribeMap<string, string>();
    const knownLocations = new Set<string>();
    const awaitResolve = new Set<string>();
    let flushAwaitResolveScheduled = false;
    let resolveMethodAvailable = false;

    const checkLoc = (loc: string | null | undefined) => {
      if (!loc || knownLocations.has(loc)) {
        return;
      }

      knownLocations.add(loc);
      awaitResolve.add(loc);

      if (!flushAwaitResolveScheduled) {
        requestIdleCallback(flushAwaitResolve);
        flushAwaitResolveScheduled = true;
      }
    };
    const flushAwaitResolve = () => {
      remoteSubscriber.callRemote(
        "resolve-source-locations",
        [...awaitResolve],
        result => {
          for (const { loc, resolved } of result) {
            resolvedLocations.set(loc, resolved);
          }

          ReactDOM.unstable_batchedUpdates(() => {
            resolvedLocations.notify();
          });
        }
      );

      flushAwaitResolveScheduled = false;
      awaitResolve.clear();
    };

    remoteSubscriber.onRemoteMethodsChanged(methods => {
      const nextResolveMethodAvailable = methods.includes(
        "resolve-source-locations"
      );

      if (!resolveMethodAvailable) {
        flushAwaitResolve();
      }

      resolveMethodAvailable = nextResolveMethodAvailable;
    });

    return {
      resolvedLocation(loc) {
        checkLoc(loc);
        return resolvedLocations.get(loc || "") || null;
      },
      subscribe(loc, fn) {
        checkLoc(loc);
        return resolvedLocations.subscribe(loc, fn);
      },
    };
  }, []);

  return (
    <SourceLocationsContext.Provider value={value}>
      {children}
    </SourceLocationsContext.Provider>
  );
}

export const useResolvedLocation = (loc: string | null | undefined) => {
  const { resolvedLocation, subscribe } = useSourceLocations();
  const [state, setState] = React.useState(resolvedLocation(loc));

  useSubscription(() => (loc ? subscribe(loc, setState) : () => null), [loc]);

  return state;
};
