import * as React from "react";
import { MessageFiber } from "../types";
import {
  notifyById,
  subscribeById,
  useComputeSubscription,
} from "./subscription";

interface FiberMapsContext {
  fiberById: SubscribeMap<number, MessageFiber>;
  fibersByParentId: SubscribeMap<number, number[]>;
  fibersByOwnerId: SubscribeMap<number, number[]>;
  mountedFibersByParentId: SubscribeMap<number, number[]>;
  mountedFibersByOwnerId: SubscribeMap<number, number[]>;
  selectChildrenMap: (
    groupByParent: boolean,
    includeUnmounted: boolean
  ) => SubscribeMap<number, number[]>;
}

const FiberMapsContext = React.createContext<FiberMapsContext>({} as any);
export const useFiberMaps = () => React.useContext(FiberMapsContext);
export function FiberMapsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value: FiberMapsContext = React.useMemo(() => {
    const fiberById = new SubscribeMap<number, MessageFiber>();
    const fibersByParentId = new SubscribeMap<number, number[]>();
    const fibersByOwnerId = new SubscribeMap<number, number[]>();
    const mountedFibersByParentId = new SubscribeMap<number, number[]>();
    const mountedFibersByOwnerId = new SubscribeMap<number, number[]>();

    return {
      fiberById,
      fibersByParentId,
      fibersByOwnerId,
      mountedFibersByParentId,
      mountedFibersByOwnerId,
      selectChildrenMap(groupByParent, includeUnmounted) {
        return groupByParent
          ? includeUnmounted
            ? fibersByParentId
            : mountedFibersByParentId
          : includeUnmounted
          ? fibersByOwnerId
          : mountedFibersByOwnerId;
      },
    };
  }, []);

  return (
    <FiberMapsContext.Provider value={value}>
      {children}
    </FiberMapsContext.Provider>
  );
}

type callback<V> = (value: V) => void;
export class SubscribeMap<K, V> extends Map<K, V> {
  private subscriptionsMap = new Map<K, Set<{ fn: callback<V | null> }>>();

  subscribe(id: K, fn: callback<V>) {
    return subscribeById<K, callback<V>>(this.subscriptionsMap, id, fn);
  }

  notify(id: K) {
    return notifyById(this.subscriptionsMap, id, this.get(id) || null);
  }
}

export const useFiber = (fiberId: number) => {
  const { fiberById } = useFiberMaps();

  const compute = React.useCallback(
    () => fiberById.get(fiberId),
    [fiberById, fiberId]
  );

  const subscribe = React.useCallback(
    requestRecompute => fiberById.subscribe(fiberId, requestRecompute),
    [fiberById, fiberId]
  );

  return useComputeSubscription(compute, subscribe);
};

const EMPTY_CHILDREN = Object.seal([]);
export const useFiberChildren = (
  fiberId: number,
  groupByParent = false,
  includeUnmounted = false
) => {
  const { selectChildrenMap } = useFiberMaps();
  const map = selectChildrenMap(groupByParent, includeUnmounted);

  const compute = React.useCallback(
    () => map.get(fiberId) || EMPTY_CHILDREN,
    [map, fiberId]
  );

  const subscribe = React.useCallback(
    requestRecompute => map.subscribe(fiberId, requestRecompute),
    [map, fiberId]
  );

  return useComputeSubscription(compute, subscribe);
};
