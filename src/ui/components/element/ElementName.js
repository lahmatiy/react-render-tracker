import React from "react";

import { getElementNameHighlight } from "../../data/helpers";

import ElementId from "./ElementId";

const ElementName = ({ data, children, isSelected, isDisabled, highlight }) => {
  const renderCount = Object.keys(data.changes || {}).length;
  const classes = `tree-element__name ${isSelected ? "selected" : ""}`;

  const name = getElementNameHighlight(data.displayName, highlight);

  return (
    <span className={classes}>
      {children}
      <span className={isDisabled ? "disabled" : ""}>
        {name}
      </span>
      <ElementId id={data.id} />
      <span className="tree-element__count">
        ({renderCount})
      </span>
    </span>
  );
};

export default ElementName;
