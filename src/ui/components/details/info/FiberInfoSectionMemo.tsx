import * as React from "react";
import { FiberEvent, MessageFiber, TransferPropChange } from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import { ChangesMatrix } from "./ChangesMatrix";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionMemo({ fiber }: { fiber: MessageFiber }) {
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
    }
  }

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
      main: event.op === "update" ? "Update" : "Bailout",
      values,
    });
  }

  return (
    <FiberInfoSection
      id="memo"
      header={`memo`}
      emptyText="No conditions for an effect"
    >
      {rows.length === 0 ? null : (
        <ChangesMatrix
          key={fiber.id}
          mainHeader="Update from owner"
          headers={[...fiberProps.keys()]}
          data={rows}
        />
      )}
    </FiberInfoSection>
  );
}
