import * as React from "react";
import { remoteSubscriber } from "../rempl-subscriber";

interface MemoryLeaksApiContext {
  breakUnmountedFiberRefs: () => void;
}

const MemoryLeaksApiContext = React.createContext<MemoryLeaksApiContext>({
  breakUnmountedFiberRefs: () => undefined,
});
export const useMemoryLeaksApi = () => React.useContext(MemoryLeaksApiContext);
export function MemoryLeaksApiContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = React.useMemo<MemoryLeaksApiContext>(() => {
    return {
      breakUnmountedFiberRefs() {
        remoteSubscriber.callRemote("break-leaked-object-refs");
      },
    };
  }, []);

  return (
    <MemoryLeaksApiContext.Provider value={value}>
      {children}
    </MemoryLeaksApiContext.Provider>
  );
}
