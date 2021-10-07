import * as React from "react";
import debounce from "lodash.debounce";

export type Subscriptions<T> = Set<{ fn: T }>;
export type SubscriptionsMap<I, T> = Map<I, Subscriptions<T>>;

const EmptySet = new Set();

export function subscribeById<I, T>(map: SubscriptionsMap<I, T>, id: I, fn: T) {
  let subscriptions = map.get(id);

  if (typeof subscriptions === "undefined") {
    subscriptions = new Set();
    map.set(id, subscriptions);
  }

  return subscribe(subscriptions, fn);
}

export function subscribe<T>(subscriptions: Subscriptions<T>, fn: T) {
  let entry: { fn: T } | undefined = { fn };
  subscriptions.add(entry);

  return () => {
    subscriptions.delete(entry as { fn: T });
    entry = undefined;
  };
}

export function notifyById<I, T extends (...args: any[]) => void>(
  map: SubscriptionsMap<I, T>,
  id: I,
  ...args: Parameters<T>
) {
  return notify(map.get(id) || (EmptySet as Subscriptions<T>), ...args);
}

export function notify<T extends (...args: any[]) => void>(
  subscriptions: Subscriptions<T>,
  ...args: Parameters<T>
) {
  for (const { fn } of subscriptions) {
    fn(...args);
  }
}

//
// Awaiting notify
//

type NotifySubject = { notify(): void };
const awaitingNotify = new Set<NotifySubject>();

export function awaitNotify(subject: NotifySubject) {
  awaitingNotify.add(subject);
}
export function stopAwatingNotify(subject: NotifySubject) {
  awaitingNotify.delete(subject);
}
export function flushNotify(subject?: NotifySubject) {
  if (subject) {
    if (awaitingNotify.has(subject)) {
      subject.notify();
      awaitingNotify.delete(subject);
    }

    return;
  }

  for (const subject of awaitingNotify) {
    subject.notify();
  }

  awaitingNotify.clear();
}

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
