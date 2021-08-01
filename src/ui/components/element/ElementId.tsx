import React from "react";

interface ElementId {
  id: number;
}

const ElementId = ({ id }) => {
  return <span className="tree-element__id">#{id}</span>;
};

export default ElementId;
