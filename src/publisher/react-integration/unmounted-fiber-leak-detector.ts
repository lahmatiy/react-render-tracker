import { MaybeLeakDescriptor, TrackingObjectType } from "common-types";
import {
  MemoryLeakDetectionApi,
  RecordEventHandler,
  TrackingObject,
  TrackingObjectMap,
} from "../types";
import { TrackingObjectTypeName } from "../../common/constants";

const DEBUG_OUTPUT = true;
const LEAK_CHECK_INTERVAL = 1000;
declare global {
  let __leakedFibers: number;
}

class FakeWeakRef implements WeakRef<TrackingObject> {
  [Symbol.toStringTag] = "WeakRef" as const;
  deref() {
    return undefined;
  }
}

// the class is used for TypeScript only
class LeakedObjectsRRTMarkerTS {
  // objects: TrackingObjectMap;

  constructor(public objects: TrackingObjectMap) {
    // this.objects = objects;
  }
}
// a hack with object to keep class name the same even when code is minified
const LeakedObjectsRRTMarker = {
  LeakedObjectsRRTMarker: class {
    // objects: TrackingObjectMap;

    constructor(public objects: TrackingObjectMap) {
      // this.objects = objects;
    }
  },
}[String("LeakedObjectsRRTMarker")] as typeof LeakedObjectsRRTMarkerTS;

const WeakRefBase = typeof WeakRef === "undefined" ? FakeWeakRef : WeakRef;
class TrackingObjectWeakRef extends WeakRefBase<TrackingObject> {
  generation: number;
  fiberId: number;
  type: TrackingObjectType;
  displayName: string | null;

  constructor(
    object: TrackingObject,
    generation: number,
    fiberId: number,
    type: TrackingObjectType,
    displayName: string | null
  ) {
    super(object);
    this.generation = generation;
    this.fiberId = fiberId;
    this.type = type;
    this.displayName = displayName;
  }

  get tag() {
    return `${this.displayName || "unknown"}(${
      TrackingObjectTypeName[this.type]
    })-${this.fiberId}`;
  }

  get descriptor() {
    return {
      fiberId: this.fiberId,
      type: this.type,
    };
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
): MemoryLeakDetectionApi & {
  trackObjectForLeaking: (
    fiber: TrackingObject,
    id: number,
    type: TrackingObjectType,
    displayName: string | null
  ) => void;
} {
  const leakCandidateObjectsWeakRefs = new Set<TrackingObjectWeakRef>();
  const leakedObjectsWeakRefs = new Set<TrackingObjectWeakRef>();
  const objectToWeakRef = new WeakMap<TrackingObject, TrackingObjectWeakRef>();
  const canaries = new Set<Canary>();
  let lastCanaryGeneration = 0;
  let lastCheckGeneration = 1;
  let generation = 1;
  let checkTrackingRefsTimer: ReturnType<typeof setTimeout> | null = null;

  function getLeakedObjectsProbe() {
    let markedLeakedObjects: LeakedObjectsRRTMarkerTS | null =
      new LeakedObjectsRRTMarker(Object.create(null));

    for (const weakRef of [...leakedObjectsWeakRefs].sort((a, b) =>
      a.tag < b.tag ? -1 : 1
    )) {
      const object = weakRef.deref();

      if (object !== undefined) {
        markedLeakedObjects.objects[weakRef.tag] = weakRef;
      }
    }

    return {
      get objects() {
        return markedLeakedObjects?.objects || null;
      },
      get markedObjects() {
        return markedLeakedObjects;
      },
      release() {
        markedLeakedObjects = null;
      },
    };
  }

  function checkTrackingRefs() {
    // Reset check timer
    if (checkTrackingRefsTimer !== null) {
      clearTimeout(checkTrackingRefsTimer);
      checkTrackingRefsTimer = null;
    }

    // Check if object generation should be changed, create a canary for previous generation
    if (lastCheckGeneration === generation) {
      generation++;

      const canary = new Canary(lastCheckGeneration);
      canaries.add(canary);
    }

    const leakCandidatesBeforeCheck = leakCandidateObjectsWeakRefs.size;
    const leaksBeforeCheck = leakedObjectsWeakRefs.size;
    const checkLeaksStart = Date.now();

    const leaksAdded: MaybeLeakDescriptor[] = [];
    const leaksRemoved: MaybeLeakDescriptor[] = [];

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

    // Revisit leaked objects if they stop to be a leak
    for (const weakRef of leakedObjectsWeakRefs) {
      if (weakRef.deref() === undefined) {
        leakedObjectsWeakRefs.delete(weakRef);
        leaksRemoved.push(weakRef.descriptor);
      }
    }

    // Revisit leak candidates refs
    for (const weakRef of leakCandidateObjectsWeakRefs) {
      if (weakRef.deref() === undefined) {
        // A candidate has been collected by GC
        leakCandidateObjectsWeakRefs.delete(weakRef);
      } else if (weakRef.generation <= lastCanaryGeneration) {
        // A candidate considered as leaked since coresponding canary object was collected
        leakCandidateObjectsWeakRefs.delete(weakRef);
        leakedObjectsWeakRefs.add(weakRef);
        leaksAdded.push(weakRef.descriptor);
      }
    }

    // Record an event when leaks set is changed
    if (leaksAdded.length || leaksRemoved.length) {
      recordEvent({
        op: "maybe-leaks",
        commitId: -1,
        added: leaksAdded,
        removed: leaksRemoved,
      });
      // console.log("Changes in leaks", {
      //   added: leaksAdded,
      //   removed: leaksRemoved,
      // });
    }

    // Debug output
    if (DEBUG_OUTPUT) {
      const candidates = [...leakCandidateObjectsWeakRefs].map(ref => ref.tag);
      const leaks = [...leakedObjectsWeakRefs].map(ref => ref.tag);

      console.log(
        `[React Render Tracker] Track objects for leaks (gen: ${lastCheckGeneration}, check: ${
          Date.now() - checkLeaksStart
        }ms, candidates: ${
          leakCandidatesBeforeCheck !== leakCandidateObjectsWeakRefs.size
            ? `${leakCandidatesBeforeCheck} → ${leakCandidateObjectsWeakRefs.size}`
            : leakCandidateObjectsWeakRefs.size
        }, leaks: ${
          leaksBeforeCheck !== leakedObjectsWeakRefs.size
            ? `${leaksBeforeCheck} → ${leakedObjectsWeakRefs.size}`
            : leakedObjectsWeakRefs.size
        }):`,
        ...(candidates.length ? ["candidates:", candidates] : []),
        ...(leaks.length ? ["leaks:", leaks] : [])
      );
    }

    // Set up a new timer in case any candidate or leak are still tracking
    if (leakCandidateObjectsWeakRefs.size || leakedObjectsWeakRefs.size) {
      checkTrackingRefsTimer = setTimeout(
        checkTrackingRefs,
        LEAK_CHECK_INTERVAL
      );
    }
  }

  function trackObjectForLeaking(
    object: TrackingObject,
    id: number,
    type: TrackingObjectType,
    displayName: string | null = null
  ) {
    let objectWeakRef = objectToWeakRef.get(object);

    if (objectWeakRef === undefined) {
      lastCheckGeneration = generation;
      objectWeakRef = new TrackingObjectWeakRef(
        object,
        generation,
        id,
        type,
        displayName
      );
      objectToWeakRef.set(object, objectWeakRef);
    } else {
      console.log("!!!occupied", id);
    }

    if (checkTrackingRefsTimer === null) {
      checkTrackingRefsTimer = setTimeout(checkTrackingRefs, 1000);
    }

    leakCandidateObjectsWeakRefs.add(objectWeakRef);
  }

  globalThis.exposeLeaks = getLeakedObjectsProbe;

  return {
    trackObjectForLeaking,
    getLeakedObjectsProbe,
  };
}
