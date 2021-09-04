import * as React from "react";
import ElementId from "../common/ElementId";
import ButtonExpand from "./ButtonExpand";
import ElementHocNames from "./ComponentHocNames";
import { MessageElement } from "../../types";
import { useFindMatch } from "../../utils/find-match";
import { useSelectionState } from "../../utils/selection";

interface TreeLeafCaptionProps {
  component: MessageElement;
  depth?: number;
  expanded: boolean;
  setExpanded?: (value: boolean) => void;
}
interface TreeLeafCaptionInnerProps extends TreeLeafCaptionProps {
  match: [offset: number, length: number] | null;
  selected: boolean;
  onSelect: (id: number) => void;
}

function getElementNameHighlight(
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

function formatDuration(duration: number) {
  let unit = "ms";

  if (duration >= 100) {
    duration /= 1000;
    unit = "s";
  }

  if (duration >= 100) {
    duration /= 60;
    unit = "m";
  }

  return duration.toFixed(1) + unit;
}

const TreeLeafCaption = ({
  component,
  depth = 0,
  expanded,
  setExpanded,
}: TreeLeafCaptionProps) => {
  const { id, displayName } = component;
  const { selected, select } = useSelectionState(id);
  const match = useFindMatch(id, displayName);

  return (
    <TreeLeafCaptionInner
      component={component}
      depth={depth}
      match={match}
      selected={selected}
      onSelect={select}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
};

const TreeLeafCaptionInner = React.memo(
  ({
    component,
    depth,
    match,
    selected,
    onSelect,
    expanded,
    setExpanded,
  }: TreeLeafCaptionInnerProps) => {
    const {
      id,
      ownerId,
      displayName,
      hocDisplayNames,
      events,
      mounted,
      rerendersCount,
      selfTime,
      totalTime,
    } = component;

    const name = getElementNameHighlight(displayName, match);
    const isRenderRoot = ownerId === 0;

    const classes = ["tree-leaf-caption"];
    for (const [cls, add] of Object.entries({
      selected,
      unmounted: !mounted,
      "render-root": isRenderRoot,
      "no-events": events.length === 0,
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
        <div className="tree-leaf-caption__timings">
          <span className="tree-leaf-caption__time" title="Self time">
            {events.length > 0 ? formatDuration(selfTime) : "\xA0"}
          </span>
          <span className="tree-leaf-caption__time" title="Total time">
            {events.length > 0 ? formatDuration(totalTime) : "\xA0"}
          </span>
        </div>
        <div className="tree-leaf-caption__main">
          {setExpanded && (
            <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
          )}
          <span className="tree-leaf-caption__name">
            {name || (!ownerId && "Render root") || "Unknown"}
          </span>
          <ElementId id={id} />
          {hocDisplayNames && <ElementHocNames names={hocDisplayNames} />}
          {rerendersCount > 0 && (
            <span className="tree-leaf-caption__count">{rerendersCount}</span>
          )}
        </div>
      </div>
    );
  }
);

TreeLeafCaptionInner.displayName = "TreeLeafCaptionInner";

export default TreeLeafCaption;
