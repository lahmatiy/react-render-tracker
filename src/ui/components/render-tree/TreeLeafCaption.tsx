import React from "react";
import ButtonExpand from "../common/ButtonExpand";
import ElementId from "../common/ElementId";
import ElementHocNames from "./ComponentHocNames";
import { MessageElement } from "../../types";

interface TreeLeafCaptionProps {
  component: MessageElement;
  depth?: number;
  selected: boolean;
  onSelect: (id: number) => void;
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  highlight: string;
}

function getElementNameHighlight(name: string, pattern: string) {
  if (!pattern || !name) {
    return name;
  }

  const matchIndex = name.toLowerCase().indexOf(pattern);

  if (matchIndex !== -1) {
    return (
      <>
        {name.slice(0, matchIndex)}
        <span className="highlight">
          {name.slice(matchIndex, matchIndex + pattern.length)}
        </span>
        {name.slice(matchIndex + pattern.length)}
      </>
    );
  }

  return name;
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

const TreeLeafCaption = React.memo(
  ({
    component,
    depth = 0,
    selected,
    onSelect,
    expanded,
    setExpanded,
    highlight,
  }: TreeLeafCaptionProps) => {
    console.log("caption", component);
    const { id, ownerId, displayName, hocDisplayNames, events, mounted } =
      component;
    const isRenderRoot = ownerId === 0;
    const rerendersCount = events?.reduce(
      (count, event) => (event.op === "rerender" ? count + 1 : count),
      0
    );
    const rerendersDuration = events?.reduce(
      (time, event) =>
        event.op === "mount" || event.op === "rerender"
          ? time + event.selfDuration
          : time,
      0
    );
    const rerendersDuration2 = events?.reduce(
      (time, event) =>
        event.op === "mount" || event.op === "rerender"
          ? time + event.actualDuration
          : time,
      0
    );

    const classes = ["tree-leaf-caption"];
    for (const [cls, add] of Object.entries({
      selected,
      unmounted: !mounted,
      "render-root": isRenderRoot,
    })) {
      if (add) {
        classes.push(cls);
      }
    }

    const name = getElementNameHighlight(displayName, highlight);
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
          <span className="tree-leaf-caption__time">
            {formatDuration(rerendersDuration)}
          </span>
          <span className="tree-leaf-caption__time">
            {formatDuration(rerendersDuration2)}
          </span>
        </div>
        <div className="tree-leaf-caption__main">
          <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
          <span className="tree-leaf-caption__name">
            {name || (!ownerId && "Render root") || "Unknown"}
          </span>
          <ElementId id={id} />
          <ElementHocNames names={hocDisplayNames} />
          {rerendersCount > 0 && (
            <span className="tree-leaf-caption__count">{rerendersCount}</span>
          )}
        </div>
      </div>
    );
  }
);

TreeLeafCaption.displayName = "TreeLeafCaption";

export default TreeLeafCaption;
