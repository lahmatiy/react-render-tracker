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
