export function subscribeById<I, T>(map: Map<I, Set<T>>, id: I, fn: T) {
  let subscriptions: Set<T>;

  if (!map.has(id)) {
    map.set(id, (subscriptions = new Set()));
  } else {
    subscriptions = map.get(id);
  }

  return subscribe(subscriptions, fn);
}

export function subscribe<T>(subscriptions: Set<T>, fn: T) {
  subscriptions.add(fn);

  return () => {
    subscriptions.delete(fn);
  };
}

export function notifyById<I, T extends (...args: any[]) => void>(
  map: Map<I, Iterable<T>>,
  id: I,
  ...args: Parameters<T>
) {
  return notify(map.get(id) || [], ...args);
}

export function notify<T extends (...args: any[]) => void>(
  subscriptions: Iterable<T>,
  ...args: Parameters<T>
) {
  for (const fn of subscriptions) {
    fn(...args);
  }
}
