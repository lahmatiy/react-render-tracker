import { ElementTypeProvider, TrackingObjectHook } from "../common/constants";
import {
  Message,
  TransferFiberChanges,
  TransferPropChange,
} from "common-types";
import {
  FiberChanges,
  FiberEvent,
  FiberStateChange,
  FiberTypeDef,
  FiberTypeStat,
  LinkedEvent,
  MessageFiber,
} from "../common/consumer-types";
import { createFiberDataset } from "./fiber-dataset";

function isShallowEqual(entry: TransferPropChange | FiberStateChange) {
  return entry.diff === false;
}

function eventChangesWarnings(
  fiber: MessageFiber,
  changes: FiberChanges | null
) {
  const warnings: FiberChanges["warnings"] = new Set();

  if (fiber.type === ElementTypeProvider && changes?.props) {
    const shallowValueChange = changes.props.find(
      change => change.name === "value" && isShallowEqual(change)
    );

    if (shallowValueChange) {
      warnings.add(shallowValueChange);
    }
  }

  if (changes?.state) {
    for (const change of changes.state) {
      if (isShallowEqual(change)) {
        warnings.add(change);
      }
    }
  }

  return warnings.size > 0 ? warnings : null;
}

export function processEvents(
  newEvents: Message[],
  allEvents: Message[],
  {
    linkedEvents,
    commitById,
    fiberById,
    fiberTypeDefById,
    fiberTypeStat,
    fibersByTypeId,
    fibersByProviderId,
    leakedFibers,
    parentTree,
    parentTreeIncludeUnmounted,
    ownerTree,
    ownerTreeIncludeUnmounted,
  }: ReturnType<typeof createFiberDataset>
) {
  const newEventsByCommitId = new Map<number, Message[]>();
  let mountCount = 0;
  let unmountCount = 0;
  let updateCount = 0;

  let fiberEventIndex = allEvents.length;
  allEvents.length += newEvents.length;

  const getFiberStat = (
    typeId: number,
    typeDef?: FiberTypeDef
  ): FiberTypeStat => {
    let typeStat = fiberTypeStat.get(typeId);

    if (typeStat === undefined) {
      if (!typeDef) {
        typeDef = fiberTypeDefById.get(typeId);
      }

      if (!typeDef) {
        throw new Error("");
      }

      typeStat = {
        typeId,
        typeDef,
        displayName: typeDef.displayName || "[render root]",
        mounts: 0,
        mountTime: 0,
        unmounts: 0,
        updates: 0,
        updateTime: 0,
      };
    }

    return typeStat;
  };
  const linkEvent = <T extends LinkedEvent>(linkedEvent: T): T => {
    const { event } = linkedEvent;
    const trigger =
      ("trigger" in event &&
        event.trigger !== undefined &&
        linkedEvents.get(allEvents[event.trigger])) ||
      null;

    linkedEvent.trigger = trigger;
    linkedEvents.set(event, linkedEvent);

    return linkedEvent;
  };
  const normChanges = (
    fiber: MessageFiber,
    changes: TransferFiberChanges | null
  ) => {
    if (changes === null) {
      return null;
    }

    const normalizedChanges: FiberChanges = {
      ...changes,
      warnings: null,
      state: changes.state?.map(change => ({
        ...change,
        hook: change.hook !== null ? fiber.typeDef.hooks[change.hook] : null,
      })),
      context:
        changes.context?.map(change => {
          const linkedEvent = linkedEvents.get(
            allEvents[change.valueChangedEventId]
          ) as FiberEvent;
          const { prev, next, diff } =
            linkedEvent?.changes?.props?.find(prop => prop.name === "value") ||
            {};

          return {
            context: fiber.typeDef.contexts?.[change.context] || null,
            prev,
            next,
            diff,
          };
        }) || null,
    };

    normalizedChanges.warnings = eventChangesWarnings(fiber, normalizedChanges);

    return normalizedChanges;
  };

  for (const event of newEvents) {
    let fiber: MessageFiber;
    let changes: FiberChanges | null = null;

    allEvents[fiberEventIndex++] = event;

    switch (event.op) {
      case "fiber-type-def": {
        const typeDef: FiberTypeDef = {
          ...event.definition,
          displayName: event.displayName,
          hooks: event.definition.hooks.map((hook, index) => ({
            index,
            ...hook,
            context:
              typeof hook.context === "number"
                ? event.definition.contexts?.[hook.context] || null
                : null,
          })),
        };

        fiberTypeDefById.set(event.typeId, typeDef);
        continue;
      }

      case "mount": {
        const typeDef = fiberTypeDefById.get(event.fiber.typeId) || {
          displayName: null,
          contexts: null,
          hooks: [],
        };

        mountCount++;

        fiber = {
          ...event.fiber,
          typeDef,
          displayName:
            event.fiber.displayName ||
            (!event.fiber.ownerId ? "Render root" : "Unknown"),
          mounted: true,
          leaked: 0,
          leakedHooks: null,
          events: [],
          updatesCount: 0,
          updatesBailoutCount: 0,
          updatesBailoutStateCount: 0,
          warnings: 0,
          selfTime: event.selfTime,
          totalTime: event.totalTime,
        };

        fibersByTypeId.add(fiber.typeId, fiber.id);
        parentTree.add(fiber.id, fiber.parentId);
        parentTreeIncludeUnmounted.add(fiber.id, fiber.parentId);
        ownerTree.add(fiber.id, fiber.ownerId);
        ownerTreeIncludeUnmounted.add(fiber.id, fiber.ownerId);

        if (typeDef.contexts) {
          for (const { providerId } of typeDef.contexts) {
            if (typeof providerId === "number") {
              fibersByProviderId.add(providerId, fiber.id);
            }
          }
        }

        const typeStat = getFiberStat(fiber.typeId, typeDef);
        fiberTypeStat.set(fiber.typeId, {
          ...typeStat,
          mounts: typeStat.mounts + 1,
          mountTime: typeStat.mountTime + event.selfTime,
        });

        break;
      }

      case "unmount": {
        unmountCount++;

        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          mounted: false,
        };

        parentTree.delete(fiber.id);
        ownerTree.delete(fiber.id);

        const typeStat = getFiberStat(fiber.typeId);
        fiberTypeStat.set(fiber.typeId, {
          ...typeStat,
          unmounts: typeStat.unmounts + 1,
        });

        break;
      }

      case "update":
        updateCount++;

        fiber = fiberById.get(event.fiberId) as MessageFiber;
        changes = normChanges(fiber, event.changes);
        fiber = {
          ...fiber,
          updatesCount: fiber.updatesCount + 1,
          selfTime: fiber.selfTime + event.selfTime,
          totalTime: fiber.totalTime + event.totalTime,
          warnings: fiber.warnings + (changes?.warnings?.size || 0),
        };

        const typeStat = getFiberStat(fiber.typeId);
        fiberTypeStat.set(fiber.typeId, {
          ...typeStat,
          updates: typeStat.updates + 1,
          updateTime: typeStat.updateTime + event.selfTime,
        });

        break;

      case "update-bailout-state":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
          updatesBailoutStateCount: fiber.updatesBailoutStateCount + 1,
        };
        break;

      case "update-bailout-memo":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
        };
        break;

      case "update-bailout-scu":
        fiber = fiberById.get(event.fiberId) as MessageFiber;
        fiber = {
          ...fiber,
          updatesBailoutCount: fiber.updatesBailoutCount + 1,
        };
        changes = normChanges(fiber, event.changes);
        break;

      // case "effect-create":
      // case "effect-destroy":
      //   fiber = fiberById.get(event.fiberId)!;
      //   break;

      case "commit-start":
        commitById.set(event.commitId, {
          commitId: event.commitId,
          start: linkEvent({
            target: "commit",
            targetId: event.commitId,
            event,
            trigger: null,
          }),
          finish: null,
          events: [],
        });
        continue;

      case "maybe-leaks": {
        for (const added of event.added) {
          const fiberId = added.fiberId;

          if (!fiberById.has(fiberId)) {
            continue;
          }

          fiber = fiberById.get(fiberId) as MessageFiber;

          if (added.type === TrackingObjectHook) {
            if (added.hookIdx === null) {
              continue;
            }

            fiber = {
              ...fiber,
              leakedHooks: fiber.leakedHooks
                ? fiber.leakedHooks.concat(added.hookIdx)
                : [added.hookIdx],
              leaked: fiber.leaked | (1 << added.type), // set a type bit to 1
            };
          } else {
            fiber = {
              ...fiber,
              leaked: fiber.leaked | (1 << added.type), // set a type bit to 1
            };
          }

          leakedFibers.add(fiberId);
          fiberById.set(fiberId, fiber);
          parentTreeIncludeUnmounted.setFiber(fiberId, fiber);
          ownerTreeIncludeUnmounted.setFiber(fiberId, fiber);
        }

        for (const removed of event.removed) {
          const fiberId = removed.fiberId;

          if (!fiberById.has(fiberId)) {
            continue;
          }

          fiber = fiberById.get(fiberId) as MessageFiber;
          if (removed.type === TrackingObjectHook) {
            const leakedHooks =
              fiber.leakedHooks?.filter(idx => idx !== removed.hookIdx) || [];
            fiber = {
              ...fiber,
              leakedHooks: leakedHooks.length ? leakedHooks : null,
              leaked: leakedHooks.length
                ? fiber.leaked
                : fiber.leaked & ~(1 << removed.type), // set a type bit to 1
            };
          } else {
            fiber = {
              ...fiber,
              leaked: fiber.leaked & ~(1 << removed.type), // set a type bit to 0
            };
          }

          if (!fiber.leaked) {
            leakedFibers.delete(fiberId);
          }

          fiberById.set(fiberId, fiber);
          parentTreeIncludeUnmounted.setFiber(fiberId, fiber);
          ownerTreeIncludeUnmounted.setFiber(fiberId, fiber);
        }

        continue;
      }

      default:
        continue;
    }

    fiber = {
      ...fiber,
      events: fiber.events.concat(
        linkEvent({
          target: "fiber",
          targetId: event.fiberId,
          event,
          changes,
          trigger: null,
          triggeredByOwner: false,
        })
      ),
    };

    fiberById.set(fiber.id, fiber);
    parentTree.setFiber(fiber.id, fiber);
    parentTreeIncludeUnmounted.setFiber(fiber.id, fiber);
    ownerTree.setFiber(fiber.id, fiber);
    ownerTreeIncludeUnmounted.setFiber(fiber.id, fiber);

    if (event.commitId >= 0) {
      const events = newEventsByCommitId.get(event.commitId);
      if (events) {
        events.push(event);
      } else {
        newEventsByCommitId.set(event.commitId, [event]);
      }
    }
  }

  for (const [commitId, events] of newEventsByCommitId) {
    const commit = commitById.get(commitId);

    if (commit) {
      commitById.set(commitId, {
        ...commit,
        events: commit.events.concat(events),
      });
    }
  }

  return {
    mountCount,
    unmountCount,
    updateCount,
  };
}
