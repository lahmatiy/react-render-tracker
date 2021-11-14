import * as React from "react";
import ButtonExpand from "./ButtonExpand";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import FiberHocNames from "../common/FiberHocNames";
import { MessageFiber } from "../../types";
import { useFindMatch } from "../../utils/find-match";
import { fiberRootMode } from "../../../common/constants";

const noop = () => undefined;

interface TreeLeafCaptionMainProps {
  fiber: MessageFiber;
  expanded?: boolean;
  setExpanded?: (value: boolean) => void;
  setFiberElement?: (id: number, element: HTMLElement | null) => void;
}

const TreeLeafCaptionContent = ({
  fiber,
  expanded = false,
  setExpanded,
  setFiberElement = noop,
}: TreeLeafCaptionMainProps) => {
  const {
    id,
    key,
    mounted,
    events,
    hocDisplayNames,
    typeDef,
    rootMode,
    updatesCount,
    updatesBailoutCount,
    warnings,
  } = fiber;

  const setMainElementRef = React.useCallback(
    element => setFiberElement(id, element),
    [setFiberElement]
  );

  return (
    <div className="tree-leaf-caption__main">
      <div className="tree-leaf-caption__main-content" ref={setMainElementRef}>
        {setExpanded && (
          <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
        )}
        <DisplayName
          displayName={fiber.displayName}
          mounted={mounted}
          events={events.length > 0}
        />
        <FiberId id={id} />
        {rootMode !== undefined ? (
          <a
            className="tree-leaf-caption__root-mode"
            href="https://reactjs.org/docs/concurrent-mode-adoption.html#why-so-many-modes"
            rel="noreferrer"
            target="_blank"
            title="Read more about root mode"
          >
            {fiberRootMode[rootMode]}
          </a>
        ) : null}
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
      </div>
    </div>
  );
};

const DisplayName = ({
  displayName,
  mounted,
  events,
}: {
  displayName: string | null;
  mounted: boolean;
  events: boolean;
}) => {
  const match = useFindMatch(displayName);
  let startStr = displayName;
  let matchStr = "";
  let endStr = "";

  if (displayName !== null && match !== null) {
    const [offset, length] = match;

    startStr = displayName.slice(0, offset);
    matchStr = displayName.slice(offset, offset + length);
    endStr = displayName.slice(offset + length);
  }

  // return displayName;

  return (
    <span
      className={
        "tree-leaf-caption-content__name" +
        (mounted ? "" : " unmounted") +
        (events ? "" : " no-events")
      }
    >
      {startStr}
      <span className="tree-leaf-caption-content__highlight">{matchStr}</span>
      {endStr}
    </span>
  );
};

export default TreeLeafCaptionContent;
