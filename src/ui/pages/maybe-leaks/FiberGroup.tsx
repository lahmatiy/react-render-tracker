import * as React from "react";
import { MessageFiber } from "../../types";
import ButtonExpand from "../../components/fiber-tree/ButtonExpand";
import { Fiber } from "./Fiber";

export function FiberGroup({
  fibers,
  initExpanded = false,
}: {
  fibers: MessageFiber[];
  initExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initExpanded);

  return (
    <div className="maybe-leaks__group">
      <div
        className="maybe-leaks__group-header"
        onClick={() => setExpanded(state => !state)}
      >
        <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
        {fibers[0].displayName}
        <span className="maybe-leaks__group-header-count">{fibers.length}</span>
      </div>

      {expanded && (
        <div className="maybe-leaks__group-fibers">
          {fibers.map(fiber => (
            <Fiber key={fiber.id} fiberId={fiber.id} />
          ))}
        </div>
      )}
    </div>
  );
}
