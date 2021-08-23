import React from "react";
import { useEffect } from "react";
import { MessageElement } from "../types";

interface GlobalMapsContext {
  componentById: SubscribeMap<number, MessageElement>;
  componentsByParentId: SubscribeMap<number, number[]>;
  componentsByOwnerId: SubscribeMap<number, number[]>;
}

const GlobalMapsContext = React.createContext<GlobalMapsContext>({} as any);
export const useGlobalMaps = () => React.useContext(GlobalMapsContext);
export function GlobalMapsContextProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const value: GlobalMapsContext = {
    componentById: new SubscribeMap(),
    componentsByParentId: new SubscribeMap(),
    componentsByOwnerId: new SubscribeMap(),
  };

  return (
    <GlobalMapsContext.Provider value={value}>
      {children}
    </GlobalMapsContext.Provider>
  );
}

type callback<V> = (value: V) => void;
class SubscribeMap<K, V> extends Map<K, V> {
  private subscriptionsMap = new Map<K, Set<callback<V>>>();

  subscribe(id: K, fn: callback<V>) {
    let subscriptions: Set<callback<V>>;

    if (!this.subscriptionsMap.has(id)) {
      this.subscriptionsMap.set(id, (subscriptions = new Set()));
    } else {
      subscriptions = this.subscriptionsMap.get(id);
    }

    subscriptions.add(fn);

    return () => {
      subscriptions.delete(fn);
    };
  }

  notify(id: K) {
    const subscriptions = this.subscriptionsMap.get(id) || [];

    for (const fn of subscriptions) {
      fn(this.get(id));
    }
  }
}

export const useComponent = (componentId: number) => {
  const { componentById } = useGlobalMaps();
  const [component, setComponent] = React.useState<MessageElement>(
    componentById.get(componentId)
  );

  useEffect(
    () => componentById.subscribe(componentId, setComponent),
    [componentId, setComponent]
  );

  return component;
};

const NOCHILDREN = [];
export const useComponentChildren = (
  componentId: number,
  groupByParent = false
) => {
  const { componentsByOwnerId, componentsByParentId } = useGlobalMaps();
  const map = groupByParent ? componentsByParentId : componentsByOwnerId;
  const [childrenIds, setChildrenIds] = React.useState<number[]>(
    () => map.get(componentId) || NOCHILDREN
  );

  useEffect(() => {
    // TODO: investigate why we need this, otherwise new children do not apply
    setChildrenIds(map.get(componentId) || NOCHILDREN);

    return map.subscribe(componentId, setChildrenIds);
  }, [componentId, map, setChildrenIds]);

  return childrenIds || [];
};
