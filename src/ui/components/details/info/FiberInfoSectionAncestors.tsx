import * as React from "react";
import { FiberEvent, MessageFiber } from "../../../types";
import { useFiberAncestors } from "../../../utils/fiber-maps";
import { FiberInfoSection } from "./FiberInfoSection";
import { Fiber } from "../Fiber";
import { useEventLog } from "../../../utils/events";

export function FiberInfoSectionAncestors({ fiber }: { fiber: MessageFiber }) {
  const ancestors = useFiberAncestors(fiber.id, true);
  const events = useEventLog(fiber.id, true, true, false);
  const markers: {
    mount?: Map<number, string>;
    update?: Map<number, string>;
    unmount?: Map<number, string>;
  } = {};

  for (const linkedEvent of events) {
    switch (linkedEvent.event.op) {
      case "mount": {
        markers.mount = new Map();

        let cursor = linkedEvent.trigger;
        while (cursor) {
          markers.mount.set(
            cursor.targetId,
            cursor.event.op === "update" ? "update-trigger" : cursor.event.op
          );
          cursor = cursor.trigger;
        }

        break;
      }
      case "update": {
        if (!markers.update) {
          markers.update = new Map();
        }

        let cursor = linkedEvent.trigger;
        while (cursor) {
          markers.update.set(cursor.targetId, cursor.event.op + "-trigger");
          cursor = cursor.trigger;
        }

        const fiberEvent = linkedEvent as FiberEvent;
        if (fiberEvent.changes?.context) {
          for (const ctx of fiberEvent.changes?.context) {
            if (ctx.context?.providerId) {
              markers.update.set(ctx.context?.providerId, "update-trigger");
            }
          }
        }
        break;
      }
      case "unmount": {
        markers.unmount = new Map();

        let cursor = linkedEvent.trigger;
        while (cursor) {
          markers.unmount.set(
            cursor.targetId,
            cursor.event.op === "update" ? "update-trigger" : cursor.event.op
          );
          cursor = cursor.trigger;
        }

        break;
      }
    }
  }

  return (
    <FiberInfoSection
      id="ancestors"
      header={`Ancestors ${
        ancestors.length > 0 ? `(${ancestors.length})` : ""
      }`}
      emptyText={"No ancestors"}
    >
      {ancestors.length === 0 ? null : (
        <div className="fiber-info-section-ancestors">
          {ancestors.map(ancestor => (
            <div key={ancestor.id} className="fiber-ancestor">
              {markers.mount && (
                <span
                  key="mount-dot"
                  className={
                    "dot " + (markers.mount.get(ancestor.id) || "skip")
                  }
                />
              )}
              {markers.update && (
                <span
                  key="update-dot"
                  className={
                    "dot " + (markers.update.get(ancestor.id) || "skip")
                  }
                />
              )}
              {markers.unmount && (
                <span
                  key="unmount-dot"
                  className={
                    "dot " + (markers.unmount.get(ancestor.id) || "skip")
                  }
                />
              )}
              <span key="content" className="fiber-ancestor__content">
                {ancestor.id === fiber.ownerId ? (
                  <span
                    className="fiber-ancestor__owner"
                    title="A component which creates selected component on its render"
                  >
                    owner
                  </span>
                ) : null}
                <Fiber fiberId={ancestor.id} />
              </span>
            </div>
          ))}
          <div key="self" className="fiber-ancestor fiber-ancestor__self">
            {markers.mount && <span className="dot mount" />}
            {markers.update && <span className="dot update" />}
            {markers.unmount && <span className="dot unmount" />}
            <span className="fiber-ancestor__content">
              <Fiber fiberId={fiber.id} />
            </span>
          </div>
        </div>
      )}
    </FiberInfoSection>
  );
}
