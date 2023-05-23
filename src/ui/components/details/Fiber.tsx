import * as React from "react";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import { useFiber } from "../../utils/fiber-maps";
import { useSelectionState } from "../../utils/selection";
import { isHostType } from "../../utils/fiber";

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
          (isHostType(fiber.type) ? " details-fiber__name_host-type" : "") +
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
