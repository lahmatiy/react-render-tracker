import * as React from "react";
import { notify, notifyById, subscribe, subscribeById } from "./subscription";

type idChangeCallback = (id: number | null) => void;
type stateChangeCallback = (state: boolean) => void;
interface Selection {
  selectedId: number | null;
  select: (nextSelectedId: number | null) => void;
  subscribe: (fn: (value: number) => void) => () => void;
  subscribeToIdState: (id: number, fn: stateChangeCallback) => () => void;
}

const SelectionContext = React.createContext<Selection>({} as any);
const useSelectionContext = () => React.useContext(SelectionContext);
export const SelectionContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value: Selection = React.useMemo(() => {
    let selectedId: number | null = null;
    const subscriptions = new Set<{ fn: idChangeCallback }>();
    const stateSubscriptionsById = new Map<
      number,
      Set<{ fn: stateChangeCallback }>
    >();
    const select: Selection["select"] = nextSelectedId => {
      const prevSelectedId = selectedId;

      if (nextSelectedId === prevSelectedId) {
        return;
      }

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
        return subscribeById<number, stateChangeCallback>(
          stateSubscriptionsById,
          id,
          fn
        );
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
  const { selectedId, subscribe } = useSelectionContext();
  const [state, setState] = React.useState(selectedId);

  React.useEffect(() => subscribe(setState), []);

  return children(state);
};

export const useSelectionState = (id: number) => {
  const { selectedId, subscribeToIdState, select } = useSelectionContext();
  const [state, setState] = React.useState(id === selectedId);

  React.useEffect(() => subscribeToIdState(id, setState), [id]);

  return { selected: state, select };
};

export const useSelectionId = (id: number) => {
  const { selectedId, subscribe } = useSelectionContext();
  const [state, setState] = React.useState<number | null>(selectedId);

  React.useEffect(() => subscribe(setState), [id]);

  return state;
};
