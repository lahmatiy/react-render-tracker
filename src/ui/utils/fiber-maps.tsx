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

export const useCommits = () => {
  const { commitById } = useFiberMaps();

  const compute = React.useCallback(
    () => [...commitById.values()],
    [commitById]
  );
  const subscribe = React.useCallback(
    requestRecompute => commitById.subscribeValues(requestRecompute),
    [commitById]
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
  let leaf = tree.getOrCreate(fiberId);

  // Requesting the root node (fiber 0) returns an invalid fiber?
  // This state is potentially (??) introduced due to an unsupported app
  // structure and a subsequent workaround in `../data/process-events`
  if (!fiberId && leaf?.fiber == null) {
    // find the next node in the tree with a valid fiber and children
    for (const [activeFiberId, { fiber, firstChild }] of tree.nodes) {
      if (fiber && firstChild) {
        leaf = tree.getOrCreate(activeFiberId);
        break;
      }
    }
  }

  const compute = React.useCallback(() => leaf.children || EMPTY_ARRAY, [leaf]);

  const subscribe = React.useCallback(
    requestRecompute => leaf.subscribe(requestRecompute),
    [leaf]
  );

  return useComputeSubscription(compute, subscribe);
};

export const useFiberAncestors = (fiberId: number, groupByParent = false) => {
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, true);
  const leaf = tree.getOrCreate(fiberId);

  const compute = React.useCallback(() => leaf.ancestors(), [leaf]);

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

export const useLeakedFibers = () => {
  const { leakedFibers } = useFiberMaps();

  const compute = React.useCallback(() => leakedFibers.value, [leakedFibers]);
  const subscribe = React.useCallback(
    requestRecompute => leakedFibers.subscribe(requestRecompute),
    [leakedFibers]
  );

  return useComputeSubscription(compute, subscribe);
};
