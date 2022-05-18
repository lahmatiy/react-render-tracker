import { ReactRenderer } from "common-types";
import * as React from "react";
import { remoteSubscriber } from "../rempl-subscriber";

type ReactRenderersContext = {
  renderers: ReactRenderer[];
  selected: ReactRenderer | null;
};

const ReactRenderersContext = React.createContext<ReactRenderersContext>({
  renderers: [],
  selected: null,
});
export const useReactRenderers = () => React.useContext(ReactRenderersContext);
export function ReactRenderersContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [renderers, setRenderers] = React.useState<ReactRenderer[]>([]);
  const value: ReactRenderersContext = React.useMemo(
    () => ({
      renderers,
      selected: renderers[0] || null,
    }),
    [renderers]
  );

  React.useEffect(
    () =>
      remoteSubscriber.ns("react-renderers").subscribe(newRenderers => {
        if (newRenderers.length) {
          setRenderers(newRenderers);
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
