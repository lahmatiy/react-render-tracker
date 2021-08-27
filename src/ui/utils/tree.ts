import debounce from "lodash.debounce";
import { SubscribeMap } from "./global-maps";

export function getSubtreeIds(id: number, childrenMap: Map<number, number[]>) {
  const subtree = new Set<number>([id]);

  for (const id of subtree) {
    const children = childrenMap.get(id) || [];

    for (const childId of children) {
      subtree.add(childId);
    }
  }

  return subtree;
}

export function subscribeSubtree(
  id: number,
  childrenMap: SubscribeMap<number, number[]>,
  fn: (added: number[], removed: number[]) => void
) {
  const subscriptions = new Map();
  const pendingAdded = new Set<number>();
  const pendingRemoved = new Set<number>();
  const notifyChanges = debounce(
    () => {
      if (pendingAdded.size === 0 && pendingRemoved.size === 0) {
        return;
      }

      const added = [...pendingAdded];
      const removed = [...pendingRemoved];

      pendingAdded.clear();
      pendingRemoved.clear();

      fn(added, removed);
    },
    1,
    { maxWait: 1 }
  );
  const remove = (id: number) => {
    if (!subscriptions.has(id)) {
      return;
    }

    const { prev, unsubscribe } = subscriptions.get(id);
    subscriptions.delete(id);
    unsubscribe();
    for (const id of prev) {
      remove(id);
    }

    pendingRemoved.add(id);
    pendingAdded.delete(id);
    notifyChanges();
  };
  const add = (id: number) => {
    if (subscriptions.has(id)) {
      return;
    }

    const descriptor = {
      prev: new Set(childrenMap.get(id)),
      unsubscribe: childrenMap.subscribe(id, (next: number[] = []) => {
        const nextSet = new Set(next);

        for (const id of nextSet) {
          if (!descriptor.prev.has(id)) {
            add(id);
          }
        }

        for (const id of descriptor.prev) {
          if (!nextSet.has(id)) {
            remove(id);
          }
        }

        descriptor.prev = nextSet;
      }),
    };

    subscriptions.set(id, descriptor);

    for (const childId of descriptor.prev) {
      add(childId);
    }

    pendingAdded.add(id);
    pendingRemoved.delete(id);
    notifyChanges();
  };

  add(id);
  notifyChanges();
  notifyChanges.flush();

  return () => {
    for (const [id] of subscriptions) {
      remove(id);
    }

    notifyChanges.flush();
    notifyChanges.cancel();
  };
}

export function findDelta(prev: Set<number>, next: Set<number>) {
  const added = [];
  const removed = [];

  for (const id of next) {
    if (!prev.has(id)) {
      added.push(id);
    }
  }

  for (const id of prev) {
    if (!next.has(id)) {
      removed.push(id);
    }
  }
}
