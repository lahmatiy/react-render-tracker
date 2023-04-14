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

type IdChangeCallback = (id: number | null) => void;
type StateChangeCallback = (state: boolean) => void;
type HistoryChangeCallback = (state: SelectionHistoryState) => void;
interface Selection {
  selectedId: number | null;
  select: (nextSelectedId: number | null, pushHistory?: boolean) => void;
  subscribe: (fn: (value: number) => void) => () => void;
  subscribeToIdState: (id: number, fn: StateChangeCallback) => () => void;
  historyState: SelectionHistoryState;
  subscribeToHistoryState(fn: HistoryChangeCallback): () => void;
}
interface SelectionHistoryState {
  hasPrev: boolean;
  prev(): void;
  hasNext: boolean;
  next(): void;
}

const SelectionContext = React.createContext<Selection>({} as any);
const useSelectionContext = () => React.useContext(SelectionContext);
export const SelectionContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value: Selection = React.useMemo(() => {
    function createHistoryState() {
      const hasPrev = historyIndex > 0;
      const hasNext = historyIndex < history.length - 1;

      return {
        hasPrev,
        prev() {
          if (hasPrev) {
            if (selectedId !== null && history[historyIndex] !== selectedId) {
              history.push(selectedId);
              historyIndex++;
            }

            selectInternal(history[--historyIndex]);
            notify(historySubscriptions, (historyState = createHistoryState()));
          }
        },
        hasNext,
        next() {
          if (hasNext) {
            selectInternal(history[++historyIndex]);
            notify(historySubscriptions, (historyState = createHistoryState()));
          }
        },
      };
    }

    let selectedId: number | null = null;
    let highlightedId: number | null = null;
    let historyIndex = -1;
    let history: number[] = [];
    let historyState: SelectionHistoryState = createHistoryState();
    const subscriptions: Subscriptions<IdChangeCallback> = new Set();
    const subscriptionsHighlight: Subscriptions<IdChangeCallback> = new Set();
    const historySubscriptions: Subscriptions<HistoryChangeCallback> =
      new Set();
    const stateSubscriptionsById: SubscriptionsMap<
      number,
      StateChangeCallback
    > = new Map();
    const highlightSubscriptionsById: SubscriptionsMap<
      number,
      StateChangeCallback
    > = new Map();
    const select: Selection["select"] = (
      nextSelectedId,
      pushHistory = true
    ) => {
      if (nextSelectedId === selectedId) {
        return;
      }

      if (nextSelectedId !== null) {
        history = history.slice(0, historyIndex + 1);

        if (pushHistory) {
          if (selectedId !== null && history[historyIndex] !== selectedId) {
            history.push(selectedId);
          }

          historyIndex = history.push(nextSelectedId) - 1;
        }

        notify(historySubscriptions, (historyState = createHistoryState()));
      }

      selectInternal(nextSelectedId);
    };
    const selectInternal = (nextSelectedId: number | null) => {
      const prevSelectedId = selectedId;

      selectedId = nextSelectedId;

      if (prevSelectedId !== null) {
        notifyById(stateSubscriptionsById, prevSelectedId, false);
      }

      if (nextSelectedId !== null) {
        notifyById(stateSubscriptionsById, nextSelectedId, true);
      }

      notify(subscriptions, selectedId);
    };
    const highlight = (nextHighlightedId) => {
      if (highlightedId == nextHighlightedId) {
        return;
      }

      if (highlightedId !== null) {
        notifyById(highlightSubscriptionsById, highlightedId, false);
      }

      highlightedId = nextHighlightedId;

      if (nextHighlightedId !== null) {
        notifyById(highlightSubscriptionsById, nextHighlightedId, true);
      }

      notify(subscriptionsHighlight, nextHighlightedId);
    }

    return {
      get selectedId() {
        return selectedId;
      },
      set selectedId(id) {
        select(id);
      },
      select,
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
      subscribeHighlight(fn) {
        return subscribe(subscriptionsHighlight, fn);
      },
      subscribeToIdState(id, fn) {
        return subscribeById<number, StateChangeCallback>(
          stateSubscriptionsById,
          id,
          fn
        );
      },
      subscribeToHighlightState(id, fn) {
        return subscribeById<number, StateChangeCallback>(
          highlightSubscriptionsById,
          id,
          fn
        );
      },

      // history
      get historyState() {
        return historyState;
      },
      subscribeToHistoryState(fn) {
        return subscribe(historySubscriptions, fn);
      },
    };
  }, []);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const SelectedIdConsumer = ({
  children,
}: {
  children: (selectedId: number | null) => JSX.Element;
}) => {
  const { selectedId } = useSelectedId();

  return children(selectedId);
};

export const useHighlightingState = (id: number) => {
  const { highlightedId, subscribeToHighlightState } = useSelectionContext();
  const [state, setState] = React.useState(id === highlightedId);

  useSubscription(() => subscribeToHighlightState(id, setState), [id]);

  return { highlighted: state };
};

export const useSelectionState = (id: number) => {
  const { selectedId, subscribeToIdState, select } = useSelectionContext();
  const [state, setState] = React.useState(id === selectedId);

  useSubscription(() => subscribeToIdState(id, setState), [id]);

  return { selected: state, select };
};

export const useSelectionHistoryState = () => {
  const { historyState, subscribeToHistoryState } = useSelectionContext();
  const [state, setState] = React.useState(historyState);

  useSubscription(() => subscribeToHistoryState(setState));

  return state;
};

export const useSelectedId = () => {
  const { selectedId, subscribe, select, highlight } = useSelectionContext();
  const [state, setState] = React.useState(selectedId);

  useSubscription(() => subscribe(setState));

  return { selectedId: state, select, highlight };
};

export const useHighlightedId = () => {
  const { highlightedId, highlight, subscribeHighlight } = useSelectionContext();
  const [state, setState] = React.useState(highlightedId);

  useSubscription(() => subscribeHighlight(setState));

  return { highlightedId: state, highlight };
};
