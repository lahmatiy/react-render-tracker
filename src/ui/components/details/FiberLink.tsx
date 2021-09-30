import * as React from "react";
import { useSelectionState } from "../../utils/selection";
import FiberId from "../common/FiberId";

export function FiberLink({ id, name }: { id: number; name: string | null }) {
  const { selected, select } = useSelectionState(id);

  return (
    <span className="details-fiber-link">
      <span
        className="details-fiber-link__name"
        onClick={!selected ? () => select(id) : undefined}
      >
        {name || "Unknown"}
      </span>
      <FiberId id={id} />
    </span>
  );
}
