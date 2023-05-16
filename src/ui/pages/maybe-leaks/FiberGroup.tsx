import * as React from "react";
import { MessageFiber } from "../../types";
import ButtonExpand from "../../components/fiber-tree/ButtonExpand";
import { Fiber } from "./Fiber";
import { useFiberMaps, useTypeIdFibers } from "../../utils/fiber-maps";
import { useMemoryLeaks } from "../../utils/memory-leaks";

export function FiberGroup({
  typeId,
  fibers,
  initExpanded = false,
}: {
  typeId: number;
  fibers: MessageFiber[];
  initExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initExpanded);
  const [collectedExpanded, setCollectedExpanded] = React.useState(false);
  const { exposeLeakedObjectsToGlobal } = useMemoryLeaks();
  const { fiberById } = useFiberMaps();
  const allTypeFiberIds = new Set(useTypeIdFibers(typeId));

  for (const fiber of fibers) {
    allTypeFiberIds.delete(fiber.id);
  }

  for (const fiberId of allTypeFiberIds) {
    const fiber = fiberById.get(fiberId);

    if (fiber?.mounted) {
      allTypeFiberIds.delete(fiberId);
    }
  }

  return (
    <div className="maybe-leaks__group">
      <div
        className="maybe-leaks__group-header"
        onClick={() => {
          setExpanded(state => !state);
          setCollectedExpanded(false);
        }}
      >
        <button
          className="maybe-leaks__group-header__expose-button"
          title={
            "Store potential leaked objects as global variable.\n\nThis allows to investigate retainers in a heap snapshot."
          }
          onClick={e => {
            e.stopPropagation();
            exposeLeakedObjectsToGlobal([
              ...new Set(fibers.map(fiber => fiber.id)),
            ]);
          }}
        ></button>
        <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
        {fibers[0].displayName}
        <span className="maybe-leaks__group-header-count">
          {fibers.length} leaked
        </span>
        {allTypeFiberIds.size > 0 ? (
          <span className="maybe-leaks__group-header_secondary-count">
            ({allTypeFiberIds.size} collected)
          </span>
        ) : (
          <span className="maybe-leaks__group-header_no-collected">
            (no collected)
          </span>
        )}
      </div>

      {expanded && (
        <div className="maybe-leaks__group-fibers">
          {allTypeFiberIds.size === 0 ? null : collectedExpanded ? (
            [...allTypeFiberIds].map(fiberId => (
              <Fiber key={fiberId} fiberId={fiberId} />
            ))
          ) : (
            <div
              className="maybe-leaks__group-fibers__show-collected"
              onClick={() => setCollectedExpanded(true)}
            >
              Show {allTypeFiberIds.size} garbage collected instance
              {allTypeFiberIds.size > 1 ? "s" : ""}...
            </div>
          )}
          {fibers.map(fiber => (
            <Fiber key={fiber.id} fiberId={fiber.id} />
          ))}
        </div>
      )}
    </div>
  );
}
