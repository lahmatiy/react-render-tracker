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

type InspectModeCallback = (inspectMode: boolean) => void;
type HighlightedFiberIdChangeCallback = (id: number | null) => void;
type StateChangeCallback = (state: boolean) => void;

interface Highlighting {
  enabled: boolean;
  inspectMode: boolean;
  highlightedId: number | null;
  highlight: (nextSelectedId: number | null, pushHistory?: boolean) => void;
  subscribeToInspectMode: (fn: InspectModeCallback) => () => void;
  subscribeToHighlightedId: (fn: (value: number) => void) => () => void;
  subscribeToFiberState: (id: number, fn: StateChangeCallback) => () => void;
  startHighlight: (id: number) => void;
  stopHighlight: () => void;
  startInspect: () => void;
  stopInspect: () => void;
  toggleInspect: () => void;
}

const defaultHighlightingContext: Highlighting = {
  enabled: false,
  inspectMode: false,
  highlightedId: null,
  highlight: () => undefined,
  subscribeToInspectMode: () => () => undefined,
  subscribeToHighlightedId: () => () => undefined,
  subscribeToFiberState: () => () => undefined,
  startHighlight: () => undefined,
  stopHighlight: () => undefined,
  startInspect: () => undefined,
  stopInspect: () => undefined,
  toggleInspect: () => undefined,
};

const HighlightingContext = React.createContext<Highlighting>(
  defaultHighlightingContext
);
const useHighlightingContext = () => React.useContext(HighlightingContext);
export const HighlightingContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value: Highlighting = React.useMemo(() => {
    const channel = remoteSubscriber.ns("highlighting");
    let highlightedId: number | null = null;
    const inspectModeSubscriptions: Subscriptions<InspectModeCallback> =
      new Set();
    const highlightedIdSubscriptions: Subscriptions<HighlightedFiberIdChangeCallback> =
      new Set();
    const fiberStateSubscriptionsById: SubscriptionsMap<
      number,
      StateChangeCallback
    > = new Map();
    let inspectMode = false;
    const startInspect = () => {
      channel.callRemote("startInspect");
    };
    const stopInspect = () => {
      channel.callRemote("stopInspect");
    };
    const toggleInspect = () => {
      if (inspectMode) {
        stopInspect();
      } else {
        startInspect();
      }
    };
    const highlight = (nextHighlightedId: number | null) => {
      if (highlightedId === nextHighlightedId) {
        return;
      }

      if (highlightedId !== null) {
        notifyById(fiberStateSubscriptionsById, highlightedId, false);
      }

      highlightedId = nextHighlightedId;

      if (nextHighlightedId !== null) {
        notifyById(fiberStateSubscriptionsById, nextHighlightedId, true);
      }

      notify(highlightedIdSubscriptions, nextHighlightedId);
    };

    return {
      enabled: true,
      get inspectMode() {
        return inspectMode;
      },
      set inspectMode(mode) {
        mode = Boolean(mode);

        if (mode !== inspectMode) {
          inspectMode = mode;
          notify(inspectModeSubscriptions, inspectMode);
        }
      },
      get highlightedId() {
        return highlightedId;
      },
      set highlightedId(id) {
        highlight(id);
      },
      highlight,
      subscribeToInspectMode(fn) {
        return subscribe(inspectModeSubscriptions, fn);
      },
      subscribeToHighlightedId(fn) {
        return subscribe(highlightedIdSubscriptions, fn);
      },
      subscribeToFiberState(id, fn) {
        return subscribeById<number, StateChangeCallback>(
          fiberStateSubscriptionsById,
          id,
          fn
        );
      },
      startHighlight(id) {
        channel.callRemote("startHighlight", id);
      },
      stopHighlight() {
        channel.callRemote("stopHighlight");
      },
      startInspect,
      stopInspect,
      toggleInspect,
    };
  }, []);

  const { highlight } = value;
  const { select } = useSelectedId();

  React.useEffect(() => {
    let lastInspecting: boolean | undefined = undefined;

    return remoteSubscriber.ns("highlighting").subscribe(state => {
      if (!state) {
        return;
      }

      const { inspecting, hoveredFiberId } = state;

      if (lastInspecting && inspecting === false && hoveredFiberId !== null) {
        select(hoveredFiberId);
      }

      highlight(inspecting ? hoveredFiberId : null);
      lastInspecting = inspecting;
      value.inspectMode = inspecting;
    });
  }, []);

  return (
    <HighlightingContext.Provider value={value}>
      {children}
    </HighlightingContext.Provider>
  );
};

export const useInspectMode = () => {
  const {
    inspectMode,
    startInspect,
    stopInspect,
    toggleInspect,
    subscribeToInspectMode,
  } = useHighlightingContext();
  const [state, setState] = React.useState(inspectMode);

  useSubscription(() => subscribeToInspectMode(setState), []);

  return {
    inspectMode: state,
    startInspect,
    stopInspect,
    toggleInspect,
  };
};

export const useHighlightingState = (id: number) => {
  const {
    highlightedId,
    subscribeToFiberState,
    startHighlight,
    stopHighlight,
  } = useHighlightingContext();
  const [state, setState] = React.useState(id === highlightedId);
  const startHighlightFiber = React.useCallback(() => startHighlight(id), [id]);

  useSubscription(() => subscribeToFiberState(id, setState), [id]);

  return {
    highlighted: state,
    startHighlight: startHighlightFiber,
    stopHighlight,
  };
};

export const useHighlightedId = () => {
  const { highlightedId, highlight, subscribeToHighlightedId } =
    useHighlightingContext();
  const [state, setState] = React.useState(highlightedId);

  useSubscription(() => subscribeToHighlightedId(setState));

  return {
    highlightedId: state,
    highlight,
  };
};
