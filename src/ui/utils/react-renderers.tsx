import * as React from "react";
import { remoteSubscriber } from "../rempl-subscriber";
import { ReactRendererInfo, ReactUnsupportedRendererInfo } from "../types";
import { RemoteProtocol } from "rempl";

type ReactRenderersContext = {
  renderers: ReactRendererInfo[];
  unsupportedRenderers: ReactUnsupportedRendererInfo[];
  selected: ReactRendererInfo | null;
};

const ReactRenderersContext = React.createContext<ReactRenderersContext>({
  renderers: [],
  unsupportedRenderers: [],
  selected: null,
});
export const useReactRenderers = () => React.useContext(ReactRenderersContext);
export function ReactRenderersContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ renderers, unsupportedRenderers }, setRenderers] = React.useState<
    RemoteProtocol["react-renderers"]["data"]
  >({ renderers: [], unsupportedRenderers: [] });
  const value: ReactRenderersContext = React.useMemo(
    () => ({
      renderers,
      unsupportedRenderers,
      selected: renderers[0] || null,
    }),
    [renderers, unsupportedRenderers]
  );

  React.useEffect(
    () =>
      remoteSubscriber
        .ns("react-renderers")
        .subscribe(({ renderers, unsupportedRenderers }) => {
          if (renderers.length || unsupportedRenderers.length) {
            setRenderers({ renderers, unsupportedRenderers });
          }
        }),
    []
  );

  return (
    <ReactRenderersContext.Provider value={value}>
      {children}
    </ReactRenderersContext.Provider>
  );
}
