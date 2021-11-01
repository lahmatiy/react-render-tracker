import * as React from "react";
import { MessageFiber } from "../../../types";
import { useFiberMaps, useProviderCustomers } from "../../../utils/fiber-maps";
import { FiberLink } from "../FiberLink";
import { FiberInfoSection } from "./FiberInfoSection";

type FiberGroup = { displayName: string; fibers: MessageFiber[] };

function byDisplayName(a: [number, FiberGroup], b: [number, FiberGroup]) {
  const { displayName: displayNameA } = a[1];
  const { displayName: displayNameB } = b[1];

  return displayNameA > displayNameB ? 1 : -1;
}

function FiberByTypeList({
  displayName,
  fibers,
}: {
  displayName: string;
  fibers: MessageFiber[];
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="fiber-info-section-consumers-type-group">
      <div
        className={
          "fiber-info-section-consumers-type-group__header" +
          (expanded
            ? " fiber-info-section-consumers-type-group__header_expanded"
            : "")
        }
        onClick={() => setExpanded(!expanded)}
      >
        {displayName} ({fibers.length})
      </div>
      <div className="fiber-info-section-consumers-type-group__content">
        {expanded &&
          fibers.map((fiber, index) => (
            <div key={index}>
              <FiberLink id={fiber.id} name={fiber.displayName} />
            </div>
          ))}
      </div>
    </div>
  );
}

export function FiberInfoSectionConsumers({ fiber }: { fiber: MessageFiber }) {
  const fiberIds = useProviderCustomers(fiber.id);
  const { fiberById } = useFiberMaps();
  const fiberByType = new Map<number, FiberGroup>();

  for (const fiberId of fiberIds) {
    const fiber = fiberById.get(fiberId) as MessageFiber;
    const { typeId } = fiber;

    if (!fiberByType.has(typeId)) {
      fiberByType.set(typeId, {
        displayName: fiber.displayName,
        fibers: [],
      });
    }

    fiberByType.get(typeId)?.fibers.push(fiber);
  }

  return (
    <FiberInfoSection id="consumers" header={`Consumers (${fiberIds.length})`}>
      {[...fiberByType.entries()]
        .sort(byDisplayName)
        .map(([typeId, { displayName, fibers }]) => (
          <FiberByTypeList
            key={typeId}
            displayName={displayName}
            fibers={fibers}
          />
        ))}
    </FiberInfoSection>
  );
}
