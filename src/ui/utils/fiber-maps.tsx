import * as React from "react";
import { MessageFiber } from "../types";
import {
  notifyById,
  subscribeById,
  useComputeSubscription,
} from "./subscription";
import { Tree } from "./tree";

interface FiberMapsContext {
  fiberById: SubscribeMap<number, MessageFiber>;
  parentTree: Tree;
  parentTreeIncludeUnmounted: Tree;
  ownerTree: Tree;
  ownerTreeIncludeUnmounted: Tree;
  selectTree: (groupByParent: boolean, includeUnmounted: boolean) => Tree;
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
    const parentTree = new Tree();
    const parentTreeIncludeUnmounted = new Tree();
    const ownerTree = new Tree();
    const ownerTreeIncludeUnmounted = new Tree();

    return {
      fiberById,
      parentTree,
      parentTreeIncludeUnmounted,
      ownerTree,
      ownerTreeIncludeUnmounted,
      selectTree(groupByParent, includeUnmounted) {
        return groupByParent
          ? includeUnmounted
            ? parentTreeIncludeUnmounted
            : parentTree
          : includeUnmounted
          ? ownerTreeIncludeUnmounted
          : ownerTree;
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
  private awaitingNotify = new Set<K>();

  hasSubscriptions(id: K) {
    const subscriptions = this.subscriptionsMap.get(id);
    return subscriptions !== undefined && subscriptions.size > 0;
  }

  subscribe(id: K, fn: callback<V>) {
    return subscribeById<K, callback<V>>(this.subscriptionsMap, id, fn);
  }

  notify(id: K) {
    return notifyById(this.subscriptionsMap, id, this.get(id) || null);
  }

  set(key: K, value: V) {
    this.awaitingNotify.add(key);
    return super.set(key, value);
  }

  delete(key: K): boolean {
    this.awaitingNotify.delete(key);
    return this.delete(key);
  }

  flushUpdates() {
    for (const key of this.awaitingNotify) {
      notifyById(this.subscriptionsMap, key, this.get(key) || null);
    }

    this.awaitingNotify.clear();
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
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, includeUnmounted);
  const leaf = tree.getOrCreate(fiberId);

  const compute = React.useCallback(
    () => leaf.children || EMPTY_CHILDREN,
    [leaf.lastChild]
  );

  const subscribe = React.useCallback(
    requestRecompute => leaf.subscribe(requestRecompute),
    [leaf]
  );

  return useComputeSubscription(compute, subscribe);
};
