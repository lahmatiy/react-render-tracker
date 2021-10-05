import * as React from "react";
import { notify, notifyById, subscribe, subscribeById } from "./subscription";

type IdChangeCallback = (id: number | null) => void;
type StateChangeCallback = (state: boolean) => void;
type HistoryChangeCallback = (state: SelectionHistoryState) => void;
interface Selection {
  selectedId: number | null;
  select: (nextSelectedId: number | null) => void;
  subscribe: (fn: (value: number) => void) => () => void;
  subscribeToIdState: (id: number, fn: StateChangeCallback) => () => void;
  historyState: SelectionHistoryState;
  subscribeToHistoryState(fn: HistoryChangeCallback): void;
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
    const history: number[] = [];
    let historyState: SelectionHistoryState = createHistoryState();
    const subscriptions = new Set<{ fn: IdChangeCallback }>();
    const historySubscriptions = new Set<{ fn: HistoryChangeCallback }>();
    const stateSubscriptionsById = new Map<
      number,
      Set<{ fn: StateChangeCallback }>
    >();
    const select: Selection["select"] = nextSelectedId => {
      if (nextSelectedId === selectedId) {
        return;
      }

      selectInternal(nextSelectedId);

      if (nextSelectedId !== null) {
        history.splice(++historyIndex, history.length, nextSelectedId);
        notify(historySubscriptions, (historyState = createHistoryState()));
      }
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

  React.useEffect(() => subscribeToIdState(id, setState), [id]);

  return { selected: state, select };
};

export const useSelectionHistoryState = () => {
  const { historyState, subscribeToHistoryState } = useSelectionContext();
  const [state, setState] = React.useState(historyState);

  React.useEffect(() => subscribeToHistoryState(setState), []);

  return state;
};

export const useSelectedId = () => {
  const { selectedId, subscribe, select } = useSelectionContext();
  const [state, setState] = React.useState(selectedId);

  React.useEffect(() => subscribe(setState), []);

  return { selectedId: state, select };
};
