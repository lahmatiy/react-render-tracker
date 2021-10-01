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
  pinned?: boolean;
  expanded?: boolean;
  setExpanded?: (value: boolean) => void;
  showTimings: boolean;
  setFiberElement?: (id: number, element: HTMLElement | null) => void;
}
interface TreeLeafCaptionInnerProps extends TreeLeafCaptionProps {
  match: [offset: number, length: number] | null;
  selected: boolean;
  onSelect: (id: number) => void;
  onPin: (id: number) => void;
}

function getFiberNameHighlight(
  name: string | null,
  range: [number, number] | null
) {
  if (name === null || range === null) {
    return name;
  }

  const [offset, length] = range;
  return (
    <>
      {name.slice(0, offset)}
      <span className="highlight">{name.slice(offset, offset + length)}</span>
      {name.slice(offset + length)}
    </>
  );
}

const TreeLeafCaption = ({
  fiber,
  depth = 0,
  pinned = false,
  expanded = false,
  setExpanded,
  showTimings,
  setFiberElement,
}: TreeLeafCaptionProps) => {
  const { id, displayName } = fiber;
  const { selected, select } = useSelectionState(id);
  const { pin } = usePinnedContext();
  const match = useFindMatch(id, displayName);

  return (
    <TreeLeafCaptionInner
      fiber={fiber}
      depth={depth}
      match={match}
      selected={selected}
      onSelect={select}
      pinned={pinned}
      onPin={pin}
      expanded={expanded}
      setExpanded={setExpanded}
      showTimings={showTimings}
      setFiberElement={setFiberElement}
    />
  );
};

const TreeLeafCaptionInner = React.memo(
  ({
    fiber,
    depth,
    match,
    selected,
    onSelect,
    pinned,
    onPin,
    expanded = false,
    setExpanded,
    showTimings,
    setFiberElement = noop,
  }: TreeLeafCaptionInnerProps) => {
    const {
      id,
      key,
      ownerId,
      displayName,
      hocDisplayNames,
      contexts,
      events,
      mounted,
      updatesCount,
      selfTime,
      totalTime,
      warnings,
    } = fiber;

    const name = getFiberNameHighlight(displayName, match);
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
      onSelect(id);
    };
    const handlePin = (event: React.MouseEvent) => {
      event.stopPropagation();
      onPin(id);
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
        <div className="tree-leaf-caption__main">
          <div
            className="tree-leaf-caption__main-content"
            ref={element => setFiberElement(id, element)}
          >
            {setExpanded && (
              <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
            )}
            <span className="tree-leaf-caption__name">{name}</span>
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
        {pinned && (
          <button
            className="tree-leaf-caption__unpin-button"
            onClick={() => onPin(0)}
          >
            Unpin
          </button>
        )}
      </div>
    );
  }
);

TreeLeafCaptionInner.displayName = "TreeLeafCaptionInner";

export default TreeLeafCaption;
