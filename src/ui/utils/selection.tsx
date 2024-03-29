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
    let historyIndex = -1;
    let history: number[] = [];
    let historyState: SelectionHistoryState = createHistoryState();
    const subscriptions: Subscriptions<IdChangeCallback> = new Set();
    const historySubscriptions: Subscriptions<HistoryChangeCallback> =
      new Set();
    const stateSubscriptionsById: SubscriptionsMap<
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

    return {
      get selectedId() {
        return selectedId;
      },
      set selectedId(id) {
        select(id);
      },
      select,
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
  const { selectedId, subscribe, select } = useSelectionContext();
  const [state, setState] = React.useState(selectedId);

  useSubscription(() => subscribe(setState));

  return { selectedId: state, select };
};

