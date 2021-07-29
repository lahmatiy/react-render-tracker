import React from "react";
import ElementId from "./ElementId";

const ElementName = ({ data, children, isSelected, isDisabled }) => {
  const renderCount = Object.keys(data.changes || {}).length;
  const classes = `tree-element__name ${isSelected ? "selected" : ""}`;

  return (
    <span className={classes}>
      {children}
      <span className="tree-element__bracket">&lt;</span>
      <span className={isDisabled ? 'disabled' : ''}>
        {data.displayName || 'Unknown'}
      </span>
      <span className="tree-element__bracket">&gt;</span>
      <ElementId id={data.id} />
      <span className="tree-element__count">
        ({renderCount})
      </span>
    </span>
  );
};

export default ElementName;
