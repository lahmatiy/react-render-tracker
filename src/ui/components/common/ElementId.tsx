import * as React from "react";

interface ElementIdProps {
  id: number;
}

const ElementId = ({ id }: ElementIdProps) => {
  return <span className="tree-element__id">#{id}</span>;
};

export default ElementId;
