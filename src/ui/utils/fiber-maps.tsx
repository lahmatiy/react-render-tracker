import * as React from "react";
import { Commit, FiberTypeDef, MessageFiber } from "../types";
import {
  SubscribeMap,
  SubsetSplit,
  useComputeSubscription,
} from "./subscription";
import { Tree } from "./tree";

interface FiberMapsContext {
  commitById: SubscribeMap<number, Commit>;
  fiberById: SubscribeMap<number, MessageFiber>;
  fiberTypeDefById: SubscribeMap<number, FiberTypeDef>;
  fibersByTypeId: SubsetSplit<number, number>;
  fibersByProviderId: SubsetSplit<number, number>;
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
    const commitById = new SubscribeMap<number, Commit>();
    const fiberById = new SubscribeMap<number, MessageFiber>();
    const fiberTypeDefById = new SubscribeMap<number, FiberTypeDef>();
    const fibersByTypeId = new SubsetSplit<number, number>();
    const fibersByProviderId = new SubsetSplit<number, number>();
    const parentTree = new Tree();
    const parentTreeIncludeUnmounted = new Tree();
    const ownerTree = new Tree();
    const ownerTreeIncludeUnmounted = new Tree();

    return {
      commitById,
      fiberById,
      fiberTypeDefById,
      fibersByTypeId,
      fibersByProviderId,
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

export const useCommit = (commitId: number) => {
  const { commitById } = useFiberMaps();

  const compute = React.useCallback(
    () => commitById.get(commitId),
    [commitById, commitId]
  );

  const subscribe = React.useCallback(
    requestRecompute => commitById.subscribe(commitId, requestRecompute),
    [commitById, commitId]
  );

  return useComputeSubscription(compute, subscribe);
};

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

export const useProviderCustomers = (providerId: number) => {
  const { fibersByProviderId } = useFiberMaps();
  const subset = fibersByProviderId.get(providerId);

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
