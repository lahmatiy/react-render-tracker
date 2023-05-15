import { TrackingObjectType } from "common-types";
import {
  MemoryLeakDetectionApi,
  RecordEventHandler,
  TrackingObject,
  TrackingObjectMap,
} from "../types";
import {
  FeatureMemLeaks,
  TrackingObjectAlternate,
  TrackingObjectStateNode,
  TrackingObjectTypeName,
} from "../../common/constants";
import { TrackingObjectFiber } from "../../common/constants";
import { ExposedToGlobalLeaksState } from "rempl";

const DEBUG_OUTPUT = true;

export type ExposedLeaksStateSubscription = (
  state: ExposedToGlobalLeaksState | null
) => void;

class FakeWeakRef implements WeakRef<TrackingObject> {
  [Symbol.toStringTag] = "WeakRef" as const;
  deref() {
    return undefined;
  }
}
const WeakRefBase = typeof WeakRef === "undefined" ? FakeWeakRef : WeakRef;
export class TrackingObjectWeakRef extends WeakRefBase<TrackingObject> {
  constructor(
    target: TrackingObject,
    public fiberId: number,
    public type: TrackingObjectType,
    public displayName: string | null,
    public hookIdx: number | null = null
  ) {
    super(target);
  }

  get tag() {
    return `${this.displayName || "unknown"} #${this.fiberId} (${
      TrackingObjectTypeName[this.type]
    })`;
  }

  get descriptor() {
    return {
      fiberId: this.fiberId,
      type: this.type,
      hookIdx: this.hookIdx,
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
    displayName: string | null,
    hookIdx: number | null
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

  function getLeakedObjectsProbe(fibersIds?: number[]) {
    const fiberFilter = Array.isArray(fibersIds) ? new Set(fibersIds) : false;
    let markedLeakedObjects: LeakedObjectsRRTMarkerTS | null =
      new LeakedObjectsRRTMarker(Object.create(null));

    for (const weakRef of [...leakedObjects].sort((a, b) =>
      a.tag < b.tag ? -1 : 1
    )) {
      const object = weakRef.deref();

      if (
        object !== undefined &&
        (!fiberFilter || fiberFilter.has(weakRef.fiberId))
      ) {
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
      { candidates, leaks }
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
    displayName: string | null = null,
    hookIdx: number | null = null
  ) {
    if (!FeatureMemLeaks) {
      return;
    }

    if (knownObjects.has(target)) {
      console.warn("[React Render Tracker] An object is already tracking", {
        fiberId,
        type,
        displayName,
      });
      return;
    }

    newCandidates.add(
      new TrackingObjectWeakRef(target, fiberId, type, displayName, hookIdx)
    );

    if (trackingNewCandidatesTimer === null) {
      trackingNewCandidatesTimer = setTimeout(startTrackingNewCandidates, 1000);
    }
  }

  const fiberProps = [
    "alternate",
    "child",
    "sibling",
    "return",
    "dependencies",
    "stateNode",
    "_debugOwner",
    "firstEffect",
    "lastEffect",
    "nextEffect",
    "memoizedState",
    "memoizedProps",
    "pendingProps",
  ];
  const stateNodeProps = ["_reactInternals", "_reactInternalInstance"];
  function breakObjectRefs<T extends string[]>(
    object: { [P in T[number]]?: unknown },
    props: T
  ) {
    for (const prop of props) {
      if (object[prop as T[number]] !== undefined) {
        object[prop as T[number]] = null;
      }
    }
  }
  function breakLeakedObjectRefsInternal(
    trackingTrackingWeakRefs: Iterable<TrackingObjectWeakRef>
  ) {
    for (const trackingObjectWeakRef of trackingTrackingWeakRefs) {
      const object = trackingObjectWeakRef.deref() as any;

      if (object !== undefined) {
        switch (trackingObjectWeakRef.type) {
          case TrackingObjectFiber:
          case TrackingObjectAlternate: {
            breakObjectRefs(object, fiberProps);
            break;
          }

          case TrackingObjectStateNode: {
            breakObjectRefs(object, stateNodeProps);
            break;
          }
        }
      }
    }
  }
  function breakLeakedObjectRefs() {
    breakLeakedObjectRefsInternal(leakedObjects);
    for (const candidates of candidatesByCanary) {
      breakLeakedObjectRefsInternal(candidates);
    }
  }

  // expose to global
  const exportToGlobalName = "LeakedObjectsRRTMarker";
  let exposedLeaksStateSubscriptions: { fn: ExposedLeaksStateSubscription }[] =
    [];
  let exposedToGlobalLeaksState: ExposedToGlobalLeaksState | null = null;
  let exposedToGlobalProbe: ReturnType<typeof getLeakedObjectsProbe> | null =
    null;
  function subscribeToExposedToGlobalLeaksState(
    fn: ExposedLeaksStateSubscription
  ) {
    const subscription = { fn };
    exposedLeaksStateSubscriptions.push(subscription);

    return () => {
      exposedLeaksStateSubscriptions = exposedLeaksStateSubscriptions.filter(
        item => item !== subscription
      );
    };
  }
  function notifyExposedToGlobalLeaksStateChange() {
    for (const { fn } of exposedLeaksStateSubscriptions) {
      fn(exposedToGlobalLeaksState);
    }
  }
  function cancelExposingLeakedObjectsToGlobalInternal() {
    const global = window as any;

    if (exposedToGlobalProbe !== null) {
      exposedToGlobalProbe.release();
      exposedToGlobalProbe = null;
    }

    if (exposedToGlobalLeaksState !== null) {
      delete global[exposedToGlobalLeaksState.globalName];
      exposedToGlobalLeaksState = null;
    }
  }
  function cancelExposingLeakedObjectsToGlobal() {
    if (exposedToGlobalLeaksState === null) {
      return;
    }

    cancelExposingLeakedObjectsToGlobalInternal();
    notifyExposedToGlobalLeaksStateChange();
  }
  function exposeLeakedObjectsToGlobal(fibersIds?: number[]) {
    const global = window as any;
    const prevExposedToGlobalLeaksState = exposedToGlobalLeaksState;

    cancelExposingLeakedObjectsToGlobalInternal();

    // generate a name
    let nameIdx = 0;
    let name = exportToGlobalName;
    while (name in global) {
      nameIdx++;
      name = exportToGlobalName + nameIdx;
    }

    // generate probe
    const probe = getLeakedObjectsProbe(fibersIds);
    const objectRefsCount = Object.keys(probe.objects || {}).length;
    const fiberIds = [
      ...new Set(Object.values(probe.objects || {}).map(ref => ref.fiberId)),
    ];

    // expose to global
    if (objectRefsCount) {
      global[name] = probe.markedObjects;
      exposedToGlobalProbe = probe;
      exposedToGlobalLeaksState = {
        globalName: name,
        objectRefsCount,
        fiberIds,
      };
    }

    if (exposedToGlobalLeaksState !== prevExposedToGlobalLeaksState) {
      notifyExposedToGlobalLeaksStateChange();
    }

    return exposedToGlobalLeaksState;
  }

  return {
    trackObjectForLeaking,
    getLeakedObjectsProbe,
    breakLeakedObjectRefs,
    getExposedToGlobalLeaksState: () => exposedToGlobalLeaksState,
    subscribeToExposedToGlobalLeaksState,
    exposeLeakedObjectsToGlobal,
    cancelExposingLeakedObjectsToGlobal,
  };
}
