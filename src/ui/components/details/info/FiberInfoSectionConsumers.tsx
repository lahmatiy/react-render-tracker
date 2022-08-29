import * as React from "react";
import { MessageFiber } from "../../../types";
import { useFiberMaps, useProviderConsumers } from "../../../utils/fiber-maps";
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
      {expanded && (
        <div className="fiber-info-section-consumers-type-group__content">
          {fibers.map((fiber, index) => (
            <div key={index}>
              <FiberLink id={fiber.id} name={fiber.displayName} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FiberInfoSectionConsumers({
  fiber,
  showUnmounted,
}: {
  fiber: MessageFiber;
  showUnmounted: boolean;
}) {
  const fiberIds = useProviderConsumers(fiber.id);
  const { fiberById } = useFiberMaps();
  const fiberByType = new Map<number, FiberGroup>();
  let fiberCount = 0;

  for (const fiberId of fiberIds) {
    const fiber = fiberById.get(fiberId) as MessageFiber;
    const { typeId, displayName, mounted } = fiber;

    if (!showUnmounted && !mounted) {
      continue;
    }

    if (!fiberByType.has(typeId)) {
      fiberByType.set(typeId, {
        displayName,
        fibers: [],
      });
    }

    fiberByType.get(typeId)?.fibers.push(fiber);
    fiberCount++;
  }

  const consumers = [...fiberByType.entries()]
    .sort(byDisplayName)
    .map(([typeId, { displayName, fibers }]) =>
      fibers.length === 1 ? (
        <div
          key={fibers[0].typeId}
          className={
            "fiber-info-section-consumers-single-instance" +
            (!fibers[0].mounted
              ? " fiber-info-section-consumers-single-instance_unmounted"
              : "")
          }
        >
          <FiberLink id={fibers[0].id} name={fibers[0].displayName} />
        </div>
      ) : (
        <FiberByTypeList
          key={typeId}
          displayName={displayName}
          fibers={fibers}
        />
      )
    );

  return (
    <FiberInfoSection
      id="consumers"
      header={fiberCount ? `Consumers (${fiberCount})` : "Consumers"}
      emptyText={"No consumers"}
    >
      {fiberCount ? consumers : null}
    </FiberInfoSection>
  );
}
