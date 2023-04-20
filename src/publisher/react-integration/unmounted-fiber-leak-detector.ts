import { TrackingObjectType } from "common-types";
import {
  MemoryLeakDetectionApi,
  RecordEventHandler,
  TrackingObject,
  TrackingObjectMap,
} from "../types";
import { TrackingObjectTypeName } from "../../common/constants";

const DEBUG_OUTPUT = true;

declare global {
  let __leakedFibers: number;
}

class FakeWeakRef implements WeakRef<TrackingObject> {
  [Symbol.toStringTag] = "WeakRef" as const;
  deref() {
    return undefined;
  }
}
const WeakRefBase = typeof WeakRef === "undefined" ? FakeWeakRef : WeakRef;
class TrackingObjectWeakRef extends WeakRefBase<TrackingObject> {
  constructor(
    target: TrackingObject,
    public fiberId: number,
    public type: TrackingObjectType,
    public displayName: string | null
  ) {
    super(target);
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

  get alive() {
    return this.deref() !== undefined;
  }
}

// the class is used for TypeScript only
class LeakedObjectsRRTMarkerTS {
  constructor(public objects: TrackingObjectMap) {}
}
// a hack with object to keep class name the same even when code is minified
const LeakedObjectsRRTMarker = {
  LeakedObjectsRRTMarker: class {
    constructor(public objects: TrackingObjectMap) {}
  },
}[String("LeakedObjectsRRTMarker")] as typeof LeakedObjectsRRTMarkerTS;

export function createUnmountedFiberLeakDetectionApi(
  recordEvent: RecordEventHandler
): MemoryLeakDetectionApi & {
  trackObjectForLeaking: (
    target: TrackingObject,
    fiberId: number,
    type: TrackingObjectType,
    displayName: string | null
  ) => void;
} {
  const knownObjects = new WeakSet<TrackingObject>();
  const candidatesByCanary = new Set<Set<TrackingObjectWeakRef>>();
  const leakedObjects = new Set<TrackingObjectWeakRef>();
  const leaksAdded = new Set<TrackingObjectWeakRef>();
  const leaksRemoved = new Set<TrackingObjectWeakRef>();
  const lastStat = { candidates: 0, leaks: 0 };
  let newCandidates = new Set<TrackingObjectWeakRef>();
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let debugOutputTimer: ReturnType<typeof setTimeout> | null = null;
  let trackingNewCandidatesTimer: ReturnType<typeof setTimeout> | null = null;

  const canariesRegistry = new FinalizationRegistry<Set<TrackingObjectWeakRef>>(
    candidates => {
      candidatesByCanary.delete(candidates);

      for (const candidate of candidates) {
        const target = candidate.deref();

        if (target !== undefined) {
          leaksRegistry.register(target, candidate);
          leakedObjects.add(candidate);
          leaksAdded.add(candidate);
        }
      }

      scheduleUpdate();
    }
  );
  const leaksRegistry = new FinalizationRegistry<TrackingObjectWeakRef>(
    leak => {
      leakedObjects.delete(leak);

      if (leaksAdded.has(leak)) {
        leaksAdded.delete(leak); // added leak is not recorded yet, just remove it
      } else {
        leaksRemoved.add(leak);
      }

      scheduleUpdate();
    }
  );

  function getLeakedObjectsProbe() {
    let markedLeakedObjects: LeakedObjectsRRTMarkerTS | null =
      new LeakedObjectsRRTMarker(Object.create(null));

    for (const weakRef of [...leakedObjects].sort((a, b) =>
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

  function debugOutput() {
    const candidates = [];
    const leaks = [...leakedObjects].map(ref => ref.tag);

    if (debugOutputTimer !== null) {
      clearTimeout(debugOutputTimer);
      debugOutputTimer = null;
    }

    for (const canaryCandidates of candidatesByCanary) {
      console.log("candidate", canaryCandidates);
      for (const candidate of canaryCandidates) {
        if (candidate.alive) {
          candidates.push(candidate.tag);
        }
      }
    }

    console.log(
      `[React Render Tracker] Track React objects for memory leaks (candidates: ${
        lastStat.candidates !== candidates.length
          ? `${lastStat.candidates} → ${candidates.length}`
          : candidates.length
      }, leaks: ${
        lastStat.leaks !== leakedObjects.size
          ? `${lastStat.leaks} → ${leakedObjects.size}`
          : leakedObjects.size
      }):`,
      ...(candidates.length ? ["candidates:", candidates] : []),
      ...(leaks.length ? ["leaks:", leaks] : [])
    );

    lastStat.candidates = candidates.length;
    lastStat.leaks = leakedObjects.size;
  }

  function scheduleDebugOutput() {
    if (DEBUG_OUTPUT && debugOutputTimer === null) {
      debugOutputTimer = setTimeout(debugOutput, 10);
    }
  }

  function recordUpdate() {
    if (updateTimer !== null) {
      clearTimeout(updateTimer);
      updateTimer = null;
    }

    if (leaksAdded.size || leaksRemoved.size) {
      recordEvent({
        op: "maybe-leaks",
        commitId: -1,
        added: [...leaksAdded].map(leak => leak.descriptor),
        removed: [...leaksRemoved].map(leak => leak.descriptor),
      });

      leaksAdded.clear();
      leaksRemoved.clear();
    }

    scheduleDebugOutput();
  }

  function scheduleUpdate() {
    if (updateTimer === null) {
      updateTimer = setTimeout(recordUpdate, 100);
    }
  }

  function startTrackingNewCandidates() {
    const canary = {};

    canariesRegistry.register(canary, newCandidates);
    candidatesByCanary.add(newCandidates);
    newCandidates = new Set();
    trackingNewCandidatesTimer = null;

    scheduleDebugOutput();
  }

  function trackObjectForLeaking(
    target: TrackingObject,
    fiberId: number,
    type: TrackingObjectType,
    displayName: string | null = null
  ) {
    if (knownObjects.has(target)) {
      console.warn("[React Render Tracker] An object is already tracking", {
        fiberId,
        type,
        displayName,
      });
      return;
    }

    newCandidates.add(
      new TrackingObjectWeakRef(target, fiberId, type, displayName)
    );

    if (trackingNewCandidatesTimer === null) {
      trackingNewCandidatesTimer = setTimeout(startTrackingNewCandidates, 1000);
    }
  }

  globalThis.exposeLeaks = getLeakedObjectsProbe;

  return {
    trackObjectForLeaking,
    getLeakedObjectsProbe,
  };
}
