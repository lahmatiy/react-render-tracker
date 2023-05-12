import * as React from "react";
import {
  notify,
  notifyById,
  subscribe,
  subscribeById,
  Subscriptions,
  SubscriptionsMap,
  useSubscription,
} from "./subscription";
import { remoteSubscriber } from "../rempl-subscriber";
import { useSelectedId } from "./selection";

type IdChangeCallback = (id: number | null) => void;
type StateChangeCallback = (state: boolean) => void;

interface Highlighting {
  highlightedId: number | null;
  highlight: (nextSelectedId: number | null, pushHistory?: boolean) => void;
  subscribe: (fn: (value: number) => void) => () => void;
  subscribeToIdState: (id: number, fn: StateChangeCallback) => () => void;
  startHighlight: (id: number, displayName: string) => void;
  stopHighlight: () => void;
  startInspect: () => void;
  stopInpect: () => void;
}

const HighlightingContext = React.createContext<Highlighting>({} as any);
const useHighlightingContext = () => React.useContext(HighlightingContext);
export const HighlightingContextProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const value: Highlighting = React.useMemo(() => {
    let highlightedId: number | null = null;
    const subscriptions: Subscriptions<IdChangeCallback> = new Set();
    const stateSubscriptionsById: SubscriptionsMap<
      number,
      StateChangeCallback
    > = new Map();
    const highlight = (nextHighlightedId: number | null) => {
      if (highlightedId == nextHighlightedId) {
        return;
      }

      if (highlightedId !== null) {
        notifyById(stateSubscriptionsById, highlightedId, false);
      }

      highlightedId = nextHighlightedId;

      if (nextHighlightedId !== null) {
        notifyById(stateSubscriptionsById, nextHighlightedId, true);
      }

      notify(subscriptions, nextHighlightedId);
    };

    return {
      get highlightedId() {
        return highlightedId;
      },
      set highlightedId(id) {
        highlight(id);
      },
      highlight,
      subscribe(fn) {
        return subscribe(subscriptions, fn);
      },
      subscribeToIdState(id, fn) {
        return subscribeById<number, StateChangeCallback>(
          stateSubscriptionsById,
          id,
          fn
        );
      },
      startHighlight(id: number, displayName: string) {
        const channel = remoteSubscriber.ns("highlighter");
        channel.callRemote("startHighlight", id, displayName);
      },
      stopHighlight() {
        const channel = remoteSubscriber.ns("highlighter");
        channel.callRemote("stopHighlight");
      },
      startInspect() {
        const channel = remoteSubscriber.ns("highlighter");
        channel.callRemote("startInspect");
      },
      stopInpect() {
        const channel = remoteSubscriber.ns("highlighter");
        channel.callRemote("stopInspect");
      }
    }
  }, []);

  const { highlight } = value;
  const { select } = useSelectedId();

  React.useEffect(
    () =>
      remoteSubscriber
        .ns("highlighter")
        .subscribe((event) => {
          if (!event) {
            return;
          }

          const { fiberID, selected = false } = event;

          if (fiberID) {
            highlight(fiberID);
            selected && select(fiberID);
          }
        }),
    []
  );

  return (
    <HighlightingContext.Provider value={value}>
      {children}
    </HighlightingContext.Provider>
  )
}

export const useHighlightingState = (id: number) => {
  const { highlightedId, subscribeToIdState } = useHighlightingContext();
  const [state, setState] = React.useState(id === highlightedId);

  useSubscription(() => subscribeToIdState(id, setState), [id]);

  return { highlighted: state };
};

export const useHighlightedId = () => {
  const { highlightedId, highlight, subscribe } = useHighlightingContext();
  const [state, setState] = React.useState(highlightedId);

  useSubscription(() => subscribe(setState));

  return { highlightedId: state, highlight };
};

export const useHighlighting = () => {
  const {
    startHighlight,
    stopHighlight,
    startInspect,
    stopInpect,
  } = useHighlightingContext();

  return {
    startHighlight,
    stopHighlight,
    startInspect,
    stopInpect,
  };
}
