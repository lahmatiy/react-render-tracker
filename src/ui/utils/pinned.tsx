import * as React from "react";
import { notify, subscribe, useSubscription } from "./subscription";

type idChangeCallback = (id: number) => void;
interface Pinned {
  pinnedId: number;
  pin: (nextPinnedId: number) => void;
  subscribe: (fn: (value: number) => void) => () => void;
}

const PinnedContext = React.createContext<Pinned>({} as any);
export const usePinnedContext = () => React.useContext(PinnedContext);
export const PinnedContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value: Pinned = React.useMemo(() => {
    let pinnedId = 0;
    const subscriptions = new Set<{ fn: idChangeCallback }>();
    const pin: Pinned["pin"] = nextPinnedId => {
      const prevPinnedId = pinnedId;

      if (nextPinnedId === prevPinnedId) {
        return;
      }

      pinnedId = nextPinnedId;
      notify(subscriptions, pinnedId);
    };

    return {
      get pinnedId() {
        return pinnedId;
      },
      set pinnedId(id) {
        pin(id);
      },
      pin,
      subscribe(fn) {
        return subscribe(subscriptions, fn);
      },
    };
  }, []);

  return (
    <PinnedContext.Provider value={value}>{children}</PinnedContext.Provider>
  );
};

export const PinnedIdConsumer = ({
  children,
}: {
  children: (pinnedId: number) => JSX.Element;
}) => {
  const { pinnedId, subscribe } = usePinnedContext();
  const [state, setState] = React.useState(pinnedId);

  useSubscription(() => subscribe(setState));

  return children(state);
};

export const usePinnedId = () => {
  const { pinnedId, subscribe, pin } = usePinnedContext();
  const [state, setState] = React.useState(pinnedId);

  useSubscription(() => subscribe(setState));

  return { pinnedId: state, pin };
};
