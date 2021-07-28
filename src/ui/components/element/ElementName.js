import React from "react";
import ElementId from "./ElementId";

const ElementName = ({ data, children, isSelected }) => {
  return (
    <span className={`tree-element__name ${isSelected ? "selected" : ""}`}>
      {children}
      <span className="tree-element__bracket">&lt;</span>
      {data.displayName || 'Unknown'}
      <span className="tree-element__bracket">&gt;</span>
      <ElementId id={data.id} />
    </span>
  );
};

export default ElementName;
