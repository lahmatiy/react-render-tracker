import * as React from "react";
import ButtonExpand from "./ButtonExpand";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import FiberHocNames from "../common/FiberHocNames";
import { MessageFiber } from "../../types";
import { useFindMatch } from "../../utils/find-match";
import { useSelectionState } from "../../utils/selection";
import { formatDuration } from "../../utils/duration";
import { usePinnedContext } from "../../utils/pinned";

const noop = () => undefined;

interface TreeLeafCaptionProps {
  fiber: MessageFiber;
  depth?: number;
  showTimings: boolean;
  pinned?: boolean;
  expanded?: boolean;
  setExpanded?: (value: boolean) => void;
  setFiberElement?: (id: number, element: HTMLElement | null) => void;
}
interface TreeLeafCaptionMainProps {
  fiber: MessageFiber;
  expanded?: boolean;
  setExpanded?: (value: boolean) => void;
  setFiberElement?: (id: number, element: HTMLElement | null) => void;
}
interface TreeLeafCaptionContainerProps {
  fiber: MessageFiber;
  depth?: number;
  showTimings: boolean;
  pinned?: boolean;
  content: React.ReactNode;
}

const TreeLeafCaption = ({
  fiber,
  depth = 0,
  showTimings,
  pinned = false,
  expanded = false,
  setExpanded,
  setFiberElement,
}: TreeLeafCaptionProps) => {
  const content = React.useMemo(
    () => (
      <TreeLeafCaptionMain
        fiber={fiber}
        expanded={expanded}
        setExpanded={setExpanded}
        setFiberElement={setFiberElement}
      />
    ),
    [fiber, expanded, setExpanded, setFiberElement]
  );

  return (
    <TreeLeafCaptionContainer
      fiber={fiber}
      depth={depth}
      pinned={pinned}
      showTimings={showTimings}
      content={content}
    />
  );
};

const TreeLeafCaptionContainer = React.memo(
  ({
    fiber,
    depth,
    pinned,
    showTimings,
    content,
  }: TreeLeafCaptionContainerProps) => {
    const { id, ownerId, events, mounted, selfTime, totalTime } = fiber;
    const { selected, select } = useSelectionState(fiber.id);
    const { pin } = usePinnedContext();

    const isRenderRoot = ownerId === 0;
    const classes = ["tree-leaf-caption"];
    for (const [cls, add] of Object.entries({
      selected,
      pinned,
      unmounted: !mounted,
      "render-root": isRenderRoot,
      "no-events": events.length === 0,
      timings: showTimings,
    })) {
      if (add) {
        classes.push(cls);
      }
    }

    const handleSelect = (event: React.MouseEvent) => {
      event.stopPropagation();
      select(id);
    };
    const handlePin = (event: React.MouseEvent) => {
      event.stopPropagation();
      pin(id);
    };

    return (
      <div
        className={classes.join(" ")}
        style={{ "--depth": depth } as React.CSSProperties}
        onClick={handleSelect}
        onDoubleClick={handlePin}
      >
        {showTimings && (
          <div className="tree-leaf-caption__timings">
            <span className="tree-leaf-caption__time" title="Self time">
              {events.length > 0 ? formatDuration(selfTime) : "\xA0"}
            </span>
            <span className="tree-leaf-caption__time" title="Total time">
              {events.length > 0 ? formatDuration(totalTime) : "\xA0"}
            </span>
          </div>
        )}

        {content}

        {pinned && (
          <button
            className="tree-leaf-caption__unpin-button"
            onClick={() => pin(0)}
          >
            Unpin
          </button>
        )}
      </div>
    );
  }
);
TreeLeafCaptionContainer.displayName = "TreeLeafCaptionContainer";

const TreeLeafCaptionMain = ({
  fiber,
  expanded = false,
  setExpanded,
  setFiberElement = noop,
}: TreeLeafCaptionMainProps) => {
  const { id, key, hocDisplayNames, contexts, updatesCount, warnings } = fiber;

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
        <DisplayName displayName={fiber.displayName} />
        {key !== null && <FiberKey fiber={fiber} />}
        <FiberId id={id} />
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
        {Array.isArray(contexts) && (
          <span
            className="tree-leaf-caption__context-count"
            title="Number of used contexts"
          >
            {contexts.length}
          </span>
        )}
      </div>
    </div>
  );
};

const DisplayName = ({ displayName }: { displayName: string | null }) => {
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

  return (
    <span className="tree-leaf-caption__name">
      {startStr}
      <span className="highlight">{matchStr}</span>
      {endStr}
    </span>
  );
};

export default TreeLeafCaption;
