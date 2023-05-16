import * as React from "react";
import FiberHocNames from "../../components/common/FiberHocNames";
import FiberKey from "../../components/common/FiberKey";
import FiberId from "../../components/common/FiberId";
import { MessageFiber } from "../../types";
import { useSelectionState } from "../../utils/selection";
import { useFiber } from "../../utils/fiber-maps";
import FiberMaybeLeak from "../../components/common/FiberMaybeLeak";

type FiberProps = {
  fiberId: number;
  setFiberElement?: (id: number, element: HTMLElement) => void;
};

const noop = () => {
  /* noop */
};
export const Fiber = ({ fiberId, setFiberElement = noop }: FiberProps) => {
  const { selected, select } = useSelectionState(fiberId);
  const fiber = useFiber(fiberId) as MessageFiber;
  const {
    id,
    key,
    leaked,
    hocDisplayNames,
    typeDef,
    updatesCount,
    updatesBailoutCount,
    warnings,
  } = fiber;

  const handleSelect = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    select(id);
  }, []);

  const setMainElementRef = React.useCallback(
    element => setFiberElement(id, element),
    [setFiberElement]
  );

  return (
    <div
      className={"maybe-leaks-page-fiber" + (selected ? " selected" : "")}
      onClick={handleSelect}
    >
      <div className="maybe-leaks-page-fiber__content" ref={setMainElementRef}>
        <span
          className={"maybe-leaks-page-fiber__name" + (leaked ? " leaked" : "")}
        >
          {fiber.displayName}
        </span>
        <FiberId id={id} />
        {/* {rootMode !== undefined ? (
          <a
            className="tree-leaf-caption__root-mode"
            href="https://reactjs.org/docs/concurrent-mode-adoption.html#why-so-many-modes"
            rel="noreferrer"
            target="_blank"
            title="Read more about render root modes"
          >
            {fiberRootMode[rootMode]}
          </a>
        ) : null} */}
        {key !== null && <FiberKey fiber={fiber} />}
        {warnings > 0 && <span className="tree-leaf-caption__warnings" />}
        {hocDisplayNames && <FiberHocNames names={hocDisplayNames} />}
        {updatesCount > 0 && (
          <span
            className="tree-leaf-caption__update-count"
            title="Number of updates"
          >
            {updatesCount}
          </span>
        )}
        {updatesBailoutCount > 0 && (
          <span
            className="tree-leaf-caption__update-bailout-count"
            title="Number of update bailouts"
          >
            {updatesBailoutCount}
          </span>
        )}
        {Array.isArray(typeDef.contexts) && (
          <span
            className="tree-leaf-caption__context-count"
            title="Number of used contexts"
          >
            {typeDef.contexts.length}
          </span>
        )}
        {leaked ? <FiberMaybeLeak leaked={leaked} /> : null}
      </div>
    </div>
  );
};
