import * as React from "react";
import { createFiberDataset } from "../../data";
import { useComputeSubscription } from "./subscription";

type FiberMapsContext = ReturnType<typeof createFiberDataset>;

const FiberMapsContext = React.createContext<FiberMapsContext>({} as any);
export const useFiberMaps = () => React.useContext(FiberMapsContext);
export function FiberMapsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value: FiberMapsContext = React.useMemo(createFiberDataset, []);

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

export const useProviderConsumers = (providerId: number) => {
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
