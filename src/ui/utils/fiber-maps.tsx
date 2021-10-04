import * as React from "react";
import { MessageFiber } from "../types";
import {
  notifyById,
  subscribeById,
  useComputeSubscription,
  Subscriptions,
  subscribe,
  notify,
  awaitNotify,
} from "./subscription";
import { Tree } from "./tree";

interface FiberMapsContext {
  fiberById: SubscribeMap<number, MessageFiber>;
  fibersByTypeId: SubsetSplit<number, number>;
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
    const fibersByTypeId = new SubsetSplit<number, number>();
    const parentTree = new Tree();
    const parentTreeIncludeUnmounted = new Tree();
    const ownerTree = new Tree();
    const ownerTreeIncludeUnmounted = new Tree();

    return {
      fiberById,
      fibersByTypeId,
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

  notify() {
    for (const id of this.awaitingNotify) {
      notifyById(this.subscriptionsMap, id, this.get(id) || null);
    }
  }

  set(key: K, value: V) {
    this.awaitingNotify.add(key);
    awaitNotify(this);

    return super.set(key, value);
  }

  delete(key: K): boolean {
    this.awaitingNotify.delete(key);
    awaitNotify(this);

    return super.delete(key);
  }

  clear() {
    this.awaitingNotify.clear();
    awaitNotify(this);

    return super.clear();
  }
}

class Subset<V> extends Set<V> {
  subscriptions: Subscriptions<callback<V[]>> = new Set();
  value: V[] = [];

  subscribe(fn: callback<V[]>) {
    return subscribe(this.subscriptions, fn);
  }
  notify() {
    this.value = [...this.values()];

    if (this.subscriptions.size === 0) {
      return;
    }

    notify(this.subscriptions, this.value);
  }

  add(value: V) {
    awaitNotify(this);

    return super.add(value);
  }
  delete(value: V) {
    awaitNotify(this);

    return super.delete(value);
  }
  clear() {
    awaitNotify(this);

    return super.clear();
  }
}

export class SubsetSplit<K, V> extends Map<K, Subset<V>> {
  private awaitingNotify = new Set<K>();

  subscribe(id: K, fn: callback<V[]>) {
    return this.get(id).subscribe(fn);
  }
  notify(id: K) {
    return this.get(id).notify();
  }

  get(id: K) {
    let subset = super.get(id);

    if (subset === undefined) {
      this.set(id, (subset = new Subset()));
    }

    return subset;
  }

  add(key: K, value: V) {
    const subset = this.get(key);

    subset.add(value);

    return this;
  }

  remove(key: K, value: V): boolean {
    const subset = this.get(key);

    if (subset !== undefined) {
      subset.delete(value);
    }

    return this.delete(key);
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

const EMPTY_ARRAY = Object.seal([]);
export const useFiberChildren = (
  fiberId: number,
  groupByParent = false,
  includeUnmounted = false
) => {
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, includeUnmounted);
  const leaf = tree.getOrCreate(fiberId);

  const compute = React.useCallback(() => leaf.children || EMPTY_ARRAY, [leaf]);

  const subscribe = React.useCallback(
    requestRecompute => leaf.subscribe(requestRecompute),
    [leaf]
  );

  return useComputeSubscription(compute, subscribe);
};

export const useTypeIdFibers = (typeId: number) => {
  const { fibersByTypeId } = useFiberMaps();
  const subset = fibersByTypeId.get(typeId);

  const compute = React.useCallback(
    () => subset.value || EMPTY_ARRAY,
    [subset]
  );

  const subscribe = React.useCallback(
    requestRecompute => subset.subscribe(requestRecompute),
    [subset]
  );

  return useComputeSubscription(compute, subscribe);
};
