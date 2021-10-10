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
    <>
      <span
        className={
          "event-list-item__name" +
          (unmounted ? " event-list-item__name_unmounted" : "") +
          (selected
            ? " event-list-item__name_selected"
            : " event-list-item__name_link")
        }
        onClick={!selected ? () => select(fiberId) : undefined}
      >
        {fiber.displayName}
      </span>
      {fiber.key !== null && <FiberKey fiber={fiber} />}
      <FiberId id={fiber.id} />
    </>
  );
};
