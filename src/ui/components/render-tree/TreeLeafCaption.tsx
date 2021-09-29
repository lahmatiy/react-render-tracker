import * as React from "react";
import ButtonExpand from "./ButtonExpand";
import FiberId from "../common/FiberId";
import FiberKey from "../common/FiberKey";
import FiberHocNames from "../common/FiberHocNames";
import { MessageFiber } from "../../types";
import { useFindMatch } from "../../utils/find-match";
import { useSelectionState } from "../../utils/selection";
import { formatDuration } from "../../utils/duration";

interface TreeLeafCaptionProps {
  fiber: MessageFiber;
  depth?: number;
  expanded: boolean;
  setExpanded?: (value: boolean) => void;
  showTimings: boolean;
}
interface TreeLeafCaptionInnerProps extends TreeLeafCaptionProps {
  match: [offset: number, length: number] | null;
  selected: boolean;
  onSelect: (id: number) => void;
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
  expanded,
  setExpanded,
  showTimings,
}: TreeLeafCaptionProps) => {
  const { id, displayName } = fiber;
  const { selected, select } = useSelectionState(id);
  const match = useFindMatch(id, displayName);

  return (
    <TreeLeafCaptionInner
      fiber={fiber}
      depth={depth}
      match={match}
      selected={selected}
      onSelect={select}
      expanded={expanded}
      setExpanded={setExpanded}
      showTimings={showTimings}
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
    expanded,
    setExpanded,
    showTimings,
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
      unmounted: !mounted,
      "render-root": isRenderRoot,
      "no-events": events.length === 0,
      "no-timings": !showTimings,
    })) {
      if (add) {
        classes.push(cls);
      }
    }

    const handleSelect = (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect(id);
    };

    return (
      <div
        className={classes.join(" ")}
        style={{ "--depth": depth } as React.CSSProperties}
        onClick={handleSelect}
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
    );
  }
);

TreeLeafCaptionInner.displayName = "TreeLeafCaptionInner";

export default TreeLeafCaption;
