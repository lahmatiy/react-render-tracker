import * as React from "react";
import { remoteSubscriber } from "../rempl-subscriber";

interface OpenFileContext {
  openInEditor: ((filepath: string) => void) | undefined;
  available: boolean;
}

const OpenFileContext = React.createContext<OpenFileContext>({
  openInEditor: () => undefined,
  available: false,
});
export const useOpenFile = () => React.useContext(OpenFileContext);
export function OpenFileContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [available, setAvailable] = React.useState(false);
  const value = React.useMemo<OpenFileContext>(
    () => ({
      available,
      openInEditor: available
        ? filepath => remoteSubscriber.callRemote("open-file", filepath)
        : undefined,
    }),
    [available]
  );

  React.useEffect(() => {
    remoteSubscriber.onRemoteMethodsChanged(methods => {
      setAvailable(methods.includes("open-file"));
    });
  }, []);

  return (
    <OpenFileContext.Provider value={value}>
      {children}
    </OpenFileContext.Provider>
  );
}
