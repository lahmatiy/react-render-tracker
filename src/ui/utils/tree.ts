import debounce from "lodash.debounce";
import {
  awaitNotify,
  notify,
  stopAwatingNotify,
  subscribe,
  Subscriptions,
} from "./subscription";

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

type SubscribeDescriptor = { prev: Set<number>; unsubscribe(): void };
export function subscribeSubtree(
  id: number,
  tree: Tree,
  fn: (added: number[], removed: number[]) => void
) {
  const subscriptions = new Map<number, SubscribeDescriptor>();
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { prev, unsubscribe } = subscriptions.get(id)!;
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
      prev: new Set(tree.getOrCreate(id).children),
      unsubscribe: tree.subscribeById(id, (node: TreeNode) => {
        const nextSet = new Set(node.children);

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

// const alwaysAccept = () => true;
// export function createPrevGetter() {}
// export function createNextGetter(
//   children: Map<number, number[]>,
//   parentRef: "parentId" | "ownerId"
// ) {
//   return function (
//     fromId: number | null,
//     accept: (fiber: MessageFiber) => boolean = alwaysAccept
//   ) {};
// }
export class Tree {
  root: TreeNode = new TreeNode(0);
  nodes = new Map<number, TreeNode>([[0, this.root]]);

  getOrCreate(id: number): TreeNode {
    let node = this.nodes.get(id);

    if (node === undefined) {
      this.nodes.set(id, (node = new TreeNode(id)));
    }

    return node;
  }

  add(id: number, parentId: number) {
    const node = this.getOrCreate(id);
    const parent = this.getOrCreate(parentId);

    node.parent = parent;
    awaitNotify(parent);
  }

  delete(id: number) {
    const node = this.nodes.get(id);

    if (node === undefined) {
      return;
    }

    for (const child of node.descendants()) {
      this.nodes.delete(child.id);
      stopAwatingNotify(child);
      child.reset(true);
    }

    if (node.parent) {
      awaitNotify(node.parent);
    }

    if (id !== 0) {
      this.nodes.delete(id);
      stopAwatingNotify(node);
    }

    node.reset();
  }

  subscribeById(id: number, fn: TreeNodeSubscription) {
    const node = this.getOrCreate(id);

    return node.subscribe(fn);
  }

  walk(fn: (node: TreeNode) => void, start?: number) {
    this.root.walk(fn, this.nodes.get(start as number));
  }
  walkBack(fn: (node: TreeNode) => void, start?: number) {
    this.root.walkBack(fn, this.nodes.get(start as number));
  }
}

type TreeNodeSubscription = (node: TreeNode) => void;
export class TreeNode {
  id: number;

  #parent: TreeNode | null = null;
  #children: number[] | null = null;
  firstChild: TreeNode | null = null;
  lastChild: TreeNode | null = null;
  nextSibling: TreeNode | null = null;
  prevSibling: TreeNode | null = null;

  subscriptions: Subscriptions<TreeNodeSubscription> = new Set();

  constructor(id: number) {
    this.id = id;
  }

  subscribe(fn: TreeNodeSubscription) {
    return subscribe(this.subscriptions, fn);
  }

  notify() {
    notify(this.subscriptions, this);
  }

  get parent(): TreeNode | null {
    return this.#parent;
  }
  set parent(newParent: TreeNode | null) {
    if (this.#parent === newParent) {
      return;
    }

    if (this.#parent !== null) {
      const oldParent = this.#parent;

      if (oldParent.firstChild === this) {
        oldParent.firstChild = this.nextSibling;
      }

      if (oldParent.lastChild === this) {
        oldParent.lastChild = this.prevSibling;
      }

      if (this.prevSibling !== null) {
        this.prevSibling.nextSibling = this.nextSibling;
      }

      if (this.nextSibling !== null) {
        this.nextSibling.prevSibling = this.prevSibling;
      }

      oldParent.#children = null;
    }

    if (newParent !== null) {
      const lastChild = newParent.lastChild;
      this.prevSibling = newParent.lastChild;
      newParent.lastChild = this;

      if (lastChild !== null) {
        lastChild.nextSibling = this;
      } else {
        newParent.firstChild = this;
      }

      newParent.#children = null;
    }

    this.#parent = newParent;
  }

  walk(fn: (node: TreeNode) => void | true, start?: TreeNode) {
    let cursor = start || this;

    do {
      let nextNode = cursor.firstChild;

      while (nextNode === null) {
        if (cursor === this) {
          return;
        }

        nextNode = cursor.nextSibling;

        if (nextNode === null) {
          if (cursor.parent === null) {
            return;
          }

          cursor = cursor.parent;
        }
      }

      cursor = nextNode;
    } while (fn(cursor) !== true);
  }

  walkBack(fn: (node: TreeNode) => void | true, start?: TreeNode) {
    let cursor = start || null;

    do {
      let prevNode = cursor !== null ? cursor.prevSibling : this.lastChild;

      if (prevNode !== null) {
        while (prevNode.lastChild !== null) {
          prevNode = prevNode.lastChild;
        }

        cursor = prevNode;
      } else if (cursor !== null) {
        cursor = cursor.parent;
      }

      if (cursor === null || cursor === this) {
        return;
      }
    } while (fn(cursor) !== true);
  }

  descendants() {
    const subtree: TreeNode[] = [];

    this.walk(node => {
      subtree.push(node);
    });

    return subtree;
  }

  get children(): number[] {
    if (this.#children !== null) {
      return this.#children;
    }

    let cursor = this.firstChild;
    this.#children = [];

    while (cursor !== null) {
      this.#children.push(cursor.id);
      cursor = cursor.nextSibling;
    }

    return this.#children;
  }

  reset(hard = false) {
    if (hard) {
      this.#parent = null;
    } else {
      this.parent = null;
    }

    this.#children = null;
    this.firstChild = null;
    this.lastChild = null;
    this.nextSibling = null;
    this.prevSibling = null;
  }
}
