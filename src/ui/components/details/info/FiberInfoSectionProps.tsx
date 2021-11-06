import * as React from "react";
import { ElementTypeMemo } from "../../../../common/constants";
import { FiberEvent, MessageFiber, TransferPropChange } from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import { ChangesMatrix } from "./ChangesMatrix";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionProps({ fiber }: { fiber: MessageFiber }) {
  const { events = [] } = useFiber(fiber.id) || {};
  const fiberProps = new Map<string, number>();
  const targetEvents: Array<FiberEvent> = [];
  const rows = [];

  for (const fiberEvent of events) {
    const { event, changes } = fiberEvent;

    switch (event.op) {
      case "mount":
        for (const name of event.props) {
          if (!fiberProps.has(name)) {
            fiberProps.set(name, fiberProps.size);
          }
        }
        break;

      case "update":
        if (changes?.props) {
          targetEvents.push(fiberEvent);

          for (const { name } of changes?.props) {
            if (!fiberProps.has(name)) {
              fiberProps.set(name, fiberProps.size);
            }
          }
        }
        break;

      case "update-bailout-memo":
        targetEvents.push(fiberEvent);
        break;

      case "update-bailout-scu":
        if (changes?.props) {
          targetEvents.push(fiberEvent);
        }
        break;
    }
  }

  if (fiberProps.size > 0) {
    for (const { event, changes } of targetEvents) {
      let values: Array<TransferPropChange | null> | null = null;

      if (changes?.props) {
        values = Array.from({ length: fiberProps.size }, () => null);
        for (const change of changes?.props) {
          values[fiberProps.get(change.name) as number] = change;
        }
      }

      rows.push({
        num: rows.length,
        main:
          event.op === "update"
            ? "Update"
            : event.op === "update-bailout-memo"
            ? "Memo HOC bailout"
            : "SCU bailout",
        values,
      });
    }
  }

  return (
    <FiberInfoSection
      id="memo"
      header={`${
        fiber.type === ElementTypeMemo
          ? "Props changes & memo"
          : "Props changes"
      } ${rows.length > 0 ? `(${rows.length})` : ""}`}
      emptyText={fiberProps.size === 0 ? "No props" : "New props never passed"}
    >
      {rows.length === 0 ? null : (
        <ChangesMatrix
          key={fiber.id}
          mainHeader="Reaction"
          headers={[...fiberProps.keys()]}
          data={rows}
        />
      )}
    </FiberInfoSection>
  );
}
