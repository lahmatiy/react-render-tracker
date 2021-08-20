import React from "react";
import ElementId from "../common/ElementId";
import ElementHocNames from "./ElementHocNames";
import { TreeElement } from "../../types";

interface ElementNameProps {
  data: TreeElement;
  children: JSX.Element;
  isSelected: boolean;
  isDisabled: boolean;
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

const ElementName = ({
  data,
  children,
  isSelected,
  isDisabled,
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
  const classes = `tree-element__name ${isSelected ? "selected" : ""} ${
    isRenderRoot ? "render-root" : ""
  } ${isDisabled ? "disabled" : ""}`;

  const name = getElementNameHighlight(data.displayName, highlight);

  return (
    <span className={classes}>
      {children}
      <span className="tree-element__name-text">
        {name || (!ownerId && "Render root") || "Unknown"}
      </span>
      <ElementId id={data.id} />
      <ElementHocNames names={data.hocDisplayNames} />
      {rerendersCount > 0 && (
        <span className="tree-element__count">{rerendersCount}</span>
      )}
      {rerendersDuration > 0 && (
        <span className="tree-element__count">
          {rerendersDuration.toFixed(1)}
        </span>
      )}
      {rerendersDuration2 > 0 && (
        <span className="tree-element__count">
          {rerendersDuration2.toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default ElementName;
