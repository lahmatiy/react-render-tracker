import React from "react";
import ButtonExpand from "../common/ButtonExpand";
import ElementId from "../common/ElementId";
import ElementHocNames from "./ComponentHocNames";
import { TreeElement } from "../../types";

interface ElementNameProps {
  depth?: number;
  data: TreeElement;
  selected: boolean;
  onSelect: (id: number) => void;
  unmounted: boolean;
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
    duration /= 100;
    unit = "s";
  }

  if (duration >= 100) {
    duration /= 100;
    unit = "m";
  }

  return duration.toFixed(1) + unit;
}

const ElementName = ({
  depth = 0,
  data,
  selected,
  onSelect,
  unmounted,
  expanded,
  setExpanded,
  highlight,
}: ElementNameProps) => {
  const { ownerId, events } = data;
  const isRenderRoot = ownerId === 0;
  const rerendersCount = events?.reduce(
    (count, event) =>
      event.op === "render" && !event.initial ? count + 1 : count,
    0
  );
  const rerendersDuration = events?.reduce(
    (time, event) => (event.op === "render" ? time + event.selfDuration : time),
    0
  );
  const rerendersDuration2 = events?.reduce(
    (time, event) =>
      event.op === "render" ? time + event.actualDuration : time,
    0
  );

  const classes = ["tree-leaf-caption"];
  for (const [cls, add] of Object.entries({
    selected,
    unmounted,
    "render-root": isRenderRoot,
  })) {
    if (add) {
      classes.push(cls);
    }
  }

  const name = getElementNameHighlight(data.displayName, highlight);
  const handleSelect = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(data.id);
  };

  return (
    <div
      className={classes.join(" ")}
      style={{ "--depth": depth } as React.CSSProperties}
      onClick={handleSelect}
    >
      <span className="tree-leaf-caption__time">
        {formatDuration(rerendersDuration)}
      </span>
      <span className="tree-leaf-caption__time">
        {formatDuration(rerendersDuration2)}
      </span>
      <div className="tree-leaf-caption__main">
        <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
        <span className="tree-leaf-caption__name">
          {name || (!ownerId && "Render root") || "Unknown"}
        </span>
        <ElementId id={data.id} />
        <ElementHocNames names={data.hocDisplayNames} />
        {rerendersCount > 0 && (
          <span className="tree-leaf-caption__count">{rerendersCount}</span>
        )}
      </div>
    </div>
  );
};

export default ElementName;
