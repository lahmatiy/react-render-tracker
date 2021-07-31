import React from "react";

import ElementId from "./ElementId";
import ElementHocNames from "./ElementHocNames";

function getElementNameHighlight(name, pattern) {
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

const ElementName = ({ data, children, isSelected, isDisabled, highlight }) => {
  const renderCount = Object.keys(data.changes || {}).length;
  const isRenderRoot = data.ownerId === 0;
  const classes = `tree-element__name ${isSelected ? "selected" : ""} ${
    isRenderRoot ? "render-root" : ""
  } ${isDisabled ? "disabled" : ""}`;

  const name = getElementNameHighlight(data.displayName, highlight);

  return (
    <span className={classes}>
      {children}
      <span className="tree-element__name-text">
        {name || (!data.ownerId && "Render root") || "Unknown"}
      </span>
      <ElementId id={data.id} />
      <ElementHocNames names={data.hocDisplayNames} />
      {renderCount > 0 && (
        <span className="tree-element__count">{renderCount}</span>
      )}
    </span>
  );
};

export default ElementName;
