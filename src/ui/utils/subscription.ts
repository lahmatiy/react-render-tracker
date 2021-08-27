import * as React from "react";
import debounce from "lodash.debounce";

export function subscribeById<I, T>(map: Map<I, Set<{ fn: T }>>, id: I, fn: T) {
  let subscriptions: Set<{ fn: T }>;

  if (!map.has(id)) {
    map.set(id, (subscriptions = new Set()));
  } else {
    subscriptions = map.get(id);
  }

  return subscribe(subscriptions, fn);
}

export function subscribe<T>(subscriptions: Set<{ fn: T }>, fn: T) {
  const entry = { fn };
  subscriptions.add(entry);

  return () => {
    entry.fn = null;
    subscriptions.delete(entry);
  };
}

export function notifyById<I, T extends (...args: any[]) => void>(
  map: Map<I, Iterable<{ fn: T }>>,
  id: I,
  ...args: Parameters<T>
) {
  return notify(map.get(id) || [], ...args);
}

export function notify<T extends (...args: any[]) => void>(
  subscriptions: Iterable<{ fn: T }>,
  ...args: Parameters<T>
) {
  for (const { fn } of subscriptions) {
    fn(...args);
  }
}

// Handle subscription right.
// We can't just use useEffect(() => subscribe()), since effect invocation
// is delayed until mount. This requires to recompute (already computed) value
// when effect fires, otherwise the value may be out of sync.
export function useSubscription(subscribe: () => () => void) {
  const subscriptionRef = React.useRef<() => void>();
  const unsubscribe = React.useCallback(() => {
    subscriptionRef.current?.();
    subscriptionRef.current = undefined;
  }, []);
  const subscription = React.useMemo(subscribe, [subscribe]);

  if (subscriptionRef.current !== subscription) {
    unsubscribe();
    subscriptionRef.current = subscription;
  }

  React.useEffect(() => unsubscribe, []);
}

export function useComputeSubscription<T>(
  compute: () => T,
  subscribe: (
    requestRecompute: () => void,
    state: { accept: boolean }
  ) => () => void
) {
  type State = {
    value: T;
  };

  const mountedRef = React.useRef(false);
  const computeRef = React.useRef<() => T>();
  const acceptRecomputeRequests = React.useRef(false);
  const lastComputedValue = React.useRef<T>();
  const [state, setState] = React.useState<State>({
    value: null,
  });

  const syncStateValue = React.useCallback(() => {
    if (mountedRef.current) {
      setState(prevState => {
        if (prevState.value === lastComputedValue.current) {
          return prevState;
        }

        return { value: lastComputedValue.current };
      });
    }
  }, []);

  // Handle recompute requests
  const recompute = React.useCallback(() => {
    lastComputedValue.current = computeRef.current();
    syncStateValue();
  }, []);
  const requestRecompute = React.useCallback(
    // accept recompute requests only after a first computation
    () => acceptRecomputeRequests.current && recompute(),
    []
  );

  if (computeRef.current !== compute) {
    acceptRecomputeRequests.current = false;
  }

  // subscribe to changes
  useSubscription(
    React.useCallback(
      () =>
        subscribe(
          requestRecompute,
          Object.freeze({
            get accept() {
              return acceptRecomputeRequests.current;
            },
          })
        ),
      [subscribe]
    )
  );

  // We can't invoke setState() until component is mounted.
  // However, a value can be recomputed by a request, so we need to sync
  // state value if needed.
  React.useEffect(() => {
    mountedRef.current = true;
    syncStateValue();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial computation on compute set
  if (computeRef.current !== compute) {
    computeRef.current = compute;
    lastComputedValue.current = compute();
    acceptRecomputeRequests.current = true;

    state.value = lastComputedValue.current;
  }

  return state.value;
}

export function useDebouncedComputeSubscription<T>(
  compute: () => T,
  subscribe: (requestRecompute: () => void) => () => void,
  debounced: number
) {
  const subscribeWithDebouncedCompute = React.useCallback(
    (requestRecompute, state) => {
      const debouncedRequestRecompute = debounce(requestRecompute, debounced);
      const unsubscribe = subscribe(() => {
        if (state.accept) {
          debouncedRequestRecompute();
        }
      });

      return () => {
        unsubscribe();
        debouncedRequestRecompute.cancel();
      };
    },
    [subscribe, debounced]
  );

  return useComputeSubscription(compute, subscribeWithDebouncedCompute);
}
