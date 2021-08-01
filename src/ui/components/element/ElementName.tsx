import React from "react";
import ElementId from "./ElementId";
import ElementHocNames from "./ElementHocNames";
import { TreeElement } from "../../types";

interface IElementName {
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
}: IElementName) => {
  const { ownerId, updates } = data;
  const isRenderRoot = ownerId === 0;
  const updatesCount = updates?.reduce(
    (count, { phase }) => (phase === "Update" ? count + 1 : count),
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
      {updatesCount > 0 && (
        <span className="tree-element__count">{updatesCount}</span>
      )}
    </span>
  );
};

export default ElementName;
