import {
  Fiber,
  ReactUnmountedFiberLeakDetectionApi,
  RecordEventHandler,
} from "../types";

declare global {
  let __leakedFibers: number;
}

class FakeWeakRef implements WeakRef<Fiber> {
  [Symbol.toStringTag] = "WeakRef" as const;
  deref() {
    return undefined;
  }
}

// a hack to keep class name the same even when code is minified
// the class is used for TypeScript only
class LeakedReactFibersMarkerTS {
  fibers: Fiber[] | null;
  constructor(fibers: Fiber[]) {
    this.fibers = fibers;
  }
}
const LeakedReactFibersMarker = {
  LeakedReactFibersMarker: class {
    fibers: Fiber[] | null;

    constructor(leakedFibers: Fiber[]) {
      this.fibers = leakedFibers;
    }
  },
}[String("LeakedReactFibersMarker")] as typeof LeakedReactFibersMarkerTS;

let unknownFiberId = 1;
const WeakRefBase = typeof WeakRef === "undefined" ? FakeWeakRef : WeakRef;
class WeakFiberRef extends WeakRefBase<Fiber> {
  id: string;
  generation: number;
  constructor(fiber: Fiber, fiberId: string | null, generation: number) {
    super(fiber);
    this.id = fiberId !== null ? fiberId : `unknown-fiber-${unknownFiberId++}`;
    this.generation = generation;
  }
}

class Canary extends WeakRefBase<any> {
  generation: number;
  constructor(generation: number) {
    super({});
    this.generation = generation;
  }
}

export function createUnmountedFiberLeakDetectionApi(
  recordEvent: RecordEventHandler
): ReactUnmountedFiberLeakDetectionApi & {
  trackUnmountedFiber: (fiber: Fiber, id?: string | null) => void;
} {
  const unmountedFiberWeakRefs = new Set<WeakFiberRef>();
  const unmountedLeakedFiberWeakRefs = new Set<WeakFiberRef>();
  const unmountedFiberToWeakRef = new WeakMap<Fiber, WeakFiberRef>();
  const canaries = new Set<Canary>();
  let lastCanaryGeneration = 0;
  let lastGeneration = 1;
  let unmountedFiberGeneration = 1;
  let unmountedFiberLeakDetectionTimer: ReturnType<typeof setTimeout> | null =
    null;

  function getLeakedUnmountedFibers() {
    let leakedFibers: Fiber[] | null = [];
    let markedLeakedFibers: LeakedReactFibersMarkerTS | null =
      new LeakedReactFibersMarker(leakedFibers);

    for (const weakRef of unmountedFiberWeakRefs) {
      const fiber = weakRef.deref();

      if (fiber !== undefined) {
        leakedFibers.push(fiber);
      }
    }

    leakedFibers = null;

    return {
      get fibers() {
        return leakedFibers;
      },
      get markedFibers() {
        return markedLeakedFibers;
      },
      release() {
        if (markedLeakedFibers !== null) {
          markedLeakedFibers.fibers = null;
          markedLeakedFibers = null;
        }

        leakedFibers = null;
      },
    };
  }

  function checkLeaks() {
    if (unmountedFiberLeakDetectionTimer !== null) {
      clearTimeout(unmountedFiberLeakDetectionTimer);
      unmountedFiberLeakDetectionTimer = null;
    }

    if (lastGeneration === unmountedFiberGeneration) {
      unmountedFiberGeneration++;

      const canary = new Canary(lastGeneration);
      canaries.add(canary);
    }

    const sizeBeforeCheck = unmountedFiberWeakRefs.size;
    const leaksAdded = [];
    const leaksRemoved = [];

    for (const canary of [...canaries].reverse()) {
      if (canary.deref() === undefined) {
        if (lastCanaryGeneration < canary.generation) {
          // console.log("canary", lastCanaryGeneration, "->", canary.generation);
          lastCanaryGeneration = canary.generation;
        }
      }

      if (canary.generation <= lastCanaryGeneration) {
        canaries.delete(canary);
      }
    }

    for (const weakRef of unmountedFiberWeakRefs) {
      if (weakRef.deref() === undefined) {
        if (unmountedLeakedFiberWeakRefs.has(weakRef)) {
          leaksRemoved.push(weakRef.id);
          unmountedLeakedFiberWeakRefs.delete(weakRef);
        }
        unmountedFiberWeakRefs.delete(weakRef);
      } else if (weakRef.generation <= lastCanaryGeneration) {
        if (!unmountedLeakedFiberWeakRefs.has(weakRef)) {
          leaksAdded.push(weakRef.id);
          unmountedLeakedFiberWeakRefs.add(weakRef);
        }
      }
    }

    if (leaksAdded.length || leaksRemoved.length) {
      recordEvent({
        op: "leaks",
        commitId: -1,
        added: leaksAdded,
        removed: leaksRemoved,
      });
      // console.log("Changes in leaks", {
      //   added: leaksAdded,
      //   removed: leaksRemoved,
      // });
    }

    // const ghosts = [...unmountedFiberWeakRefs]
    //   .filter(ref => !unmountedLeakedFiberWeakRefs.has(ref))
    //   .map(ref => ref.id);
    // const leaks = [...unmountedLeakedFiberWeakRefs].map(ref => ref.id);

    // console.log(
    //   `Track unmounted fibers for leaks (gen: ${lastGeneration}):`,
    //   ...(sizeBeforeCheck !== unmountedFiberWeakRefs.size
    //     ? [sizeBeforeCheck, "->", unmountedFiberWeakRefs.size]
    //     : [unmountedFiberWeakRefs.size]),
    //   ...(ghosts.length ? ["ghosts:", ghosts] : []),
    //   ...(leaks.length ? ["leaks:", leaks] : [])
    // );

    if (unmountedFiberWeakRefs.size) {
      unmountedFiberLeakDetectionTimer = setTimeout(checkLeaks, 1000);
    }
  }

  function trackUnmountedFiber(fiber: Fiber, id: string | null = null) {
    let fiberRef = unmountedFiberToWeakRef.get(fiber);

    if (fiberRef === undefined) {
      lastGeneration = unmountedFiberGeneration;
      fiberRef = new WeakFiberRef(fiber, id, unmountedFiberGeneration);
      unmountedFiberToWeakRef.set(fiber, fiberRef);
    }

    if (unmountedFiberLeakDetectionTimer === null) {
      unmountedFiberLeakDetectionTimer = setTimeout(checkLeaks, 1000);
    }

    unmountedFiberWeakRefs.add(fiberRef);
  }

  globalThis.exposeLeaks = getLeakedUnmountedFibers;

  return {
    trackUnmountedFiber,
    getLeakedUnmountedFibers,
  };
}
