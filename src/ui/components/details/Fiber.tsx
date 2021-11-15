import * as React from "react";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import { useFiber } from "../../utils/fiber-maps";
import { useSelectionState } from "../../utils/selection";

export const Fiber = ({
  fiberId,
  unmounted = false,
}: {
  fiberId: number;
  unmounted?: boolean;
}) => {
  const fiber = useFiber(fiberId);
  const { selected, select } = useSelectionState(fiberId);

  if (!fiber) {
    return null;
  }

  return (
    <span className="details-fiber">
      <span
        className={
          "details-fiber__name" +
          (unmounted ? " details-fiber__name_unmounted" : "") +
          (selected
            ? " details-fiber__name_selected"
            : " details-fiber__name_link")
        }
        onClick={!selected ? () => select(fiberId) : undefined}
      >
        {fiber.displayName}
      </span>
      <FiberId id={fiber.id} />
      {fiber.key !== null && <FiberKey fiber={fiber} />}
    </span>
  );
};
