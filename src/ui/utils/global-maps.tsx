import React from "react";
import { MessageElement } from "../types";
import {
  notifyById,
  subscribeById,
  useComputeSubscription,
} from "./subscription";

interface GlobalMapsContext {
  componentById: SubscribeMap<number, MessageElement>;
  componentsByParentId: SubscribeMap<number, number[]>;
  componentsByOwnerId: SubscribeMap<number, number[]>;
  mountedComponentsByParentId: SubscribeMap<number, number[]>;
  mountedComponentsByOwnerId: SubscribeMap<number, number[]>;
  selectChildrenMap: (
    groupByParent: boolean,
    includeUnmounted: boolean
  ) => SubscribeMap<number, number[]>;
}

const GlobalMapsContext = React.createContext<GlobalMapsContext>({} as any);
export const useGlobalMaps = () => React.useContext(GlobalMapsContext);
export function GlobalMapsContextProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const value: GlobalMapsContext = React.useMemo(() => {
    const componentById = new SubscribeMap<number, MessageElement>();
    const componentsByParentId = new SubscribeMap<number, number[]>();
    const componentsByOwnerId = new SubscribeMap<number, number[]>();
    const mountedComponentsByParentId = new SubscribeMap<number, number[]>();
    const mountedComponentsByOwnerId = new SubscribeMap<number, number[]>();

    return {
      componentById,
      componentsByParentId,
      componentsByOwnerId,
      mountedComponentsByParentId,
      mountedComponentsByOwnerId,
      selectChildrenMap(groupByParent, includeUnmounted) {
        return groupByParent
          ? includeUnmounted
            ? componentsByParentId
            : mountedComponentsByParentId
          : includeUnmounted
          ? componentsByOwnerId
          : mountedComponentsByOwnerId;
      },
    };
  }, []);

  return (
    <GlobalMapsContext.Provider value={value}>
      {children}
    </GlobalMapsContext.Provider>
  );
}

type callback<V> = (value: V) => void;
export class SubscribeMap<K, V> extends Map<K, V> {
  private subscriptionsMap = new Map<K, Set<{ fn: callback<V> }>>();

  subscribe(id: K, fn: callback<V>) {
    return subscribeById<K, callback<V>>(this.subscriptionsMap, id, fn);
  }

  notify(id: K) {
    return notifyById(this.subscriptionsMap, id, this.get(id));
  }
}

export const useComponent = (componentId: number) => {
  const { componentById } = useGlobalMaps();

  const compute = React.useCallback(
    () => componentById.get(componentId),
    [componentById, componentId]
  );

  const subscribe = React.useCallback(
    requestRecompute => componentById.subscribe(componentId, requestRecompute),
    [componentById, componentId]
  );

  return useComputeSubscription(compute, subscribe);
};

const EMPTY_CHILDREN = Object.seal([]);
export const useComponentChildren = (
  componentId: number,
  groupByParent = false,
  includeUnmounted = false
) => {
  const { selectChildrenMap } = useGlobalMaps();
  const map = selectChildrenMap(groupByParent, includeUnmounted);

  const compute = React.useCallback(
    () => map.get(componentId) || EMPTY_CHILDREN,
    [map, componentId]
  );

  const subscribe = React.useCallback(
    requestRecompute => map.subscribe(componentId, requestRecompute),
    [map, componentId]
  );

  return useComputeSubscription(compute, subscribe);
};
