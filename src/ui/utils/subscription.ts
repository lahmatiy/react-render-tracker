import * as React from "react";
import debounce from "lodash.debounce";
export * from "../../data/subscription";

// Handle subscription right.
// We can't just use useEffect(() => subscribe()), since effect invocation
// is delayed until mount. This requires to recompute (already computed) value
// when effect fires, otherwise the value may be out of sync.
export function useSubscription(subscribe: () => () => void, deps: any[] = []) {
  const subscriptionRef = React.useRef<() => void>();
  const unsubscribe = React.useCallback(() => {
    subscriptionRef.current?.();
    subscriptionRef.current = undefined;
  }, []);

  subscriptionRef.current = React.useMemo(() => {
    unsubscribe();
    return subscribe();
  }, deps);

  React.useEffect(() => unsubscribe, []);
}

export function useComputeSubscription<T>(
  compute: () => T,
  subscribe: (requestRecompute: () => void, accept: boolean) => () => void
) {
  type State = {
    compute: () => T;
    subscribe: (requestRecompute: () => void, accept: boolean) => () => void;
    value: T;
  };

  const mountedRef = React.useRef(false);
  const acceptRecomputeRequestsRef = React.useRef(false);
  const isRecomputeNeededRef = React.useRef(false);
  const [state, setState] = React.useState<State>({
    compute: undefined,
    subscribe: undefined,
    value: undefined,
  } as any);
  let valueToReturn = state.value;

  const syncStateValue = React.useCallback(() => {
    if (isRecomputeNeededRef.current && mountedRef.current) {
      setState(prevState => {
        const newValue = prevState.compute();

        if (prevState.value === newValue) {
          return prevState;
        }

        return {
          ...prevState,
          value: newValue,
        };
      });
    }
  }, []);

  // Handle recompute requests
  acceptRecomputeRequestsRef.current = state.compute === compute;

  // subscribe to changes
  useSubscription(
    () =>
      subscribe(() => {
        isRecomputeNeededRef.current = acceptRecomputeRequestsRef.current;
        syncStateValue();
      }, acceptRecomputeRequestsRef.current),
    [subscribe]
  );

  // We can't invoke setState() until fiber is mounted.
  // However, a value can be recomputed by a request, so we need to sync
  // state value if needed.
  React.useEffect(() => {
    mountedRef.current = true;
    syncStateValue();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial computation on compute & subscribe set
  if (state.compute !== compute || state.subscribe !== subscribe) {
    acceptRecomputeRequestsRef.current = true;
    valueToReturn = compute();

    Object.assign(state, {
      compute,
      subscribe,
      value: valueToReturn,
    });
  }

  return valueToReturn;
}

export function useDebouncedComputeSubscription<T>(
  compute: () => T,
  subscribe: (requestRecompute: () => void) => () => void,
  debounced: number
) {
  const subscribeWithDebouncedCompute = React.useCallback(
    (requestRecompute, acceptRequests) => {
      const debouncedRequestRecompute = debounce(requestRecompute, debounced);
      const unsubscribe = subscribe(() => debouncedRequestRecompute());

      // cancel any recompute requests after a subscription
      if (!acceptRequests) {
        debouncedRequestRecompute.cancel();
      }

      return () => {
        unsubscribe();
        debouncedRequestRecompute.cancel();
      };
    },
    [subscribe, debounced]
  );

  return useComputeSubscription(compute, subscribeWithDebouncedCompute);
}
