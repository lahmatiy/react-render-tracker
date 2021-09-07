import * as React from "react";

interface ElementIdProps {
  id: number;
}

const ElementId = ({ id }: ElementIdProps) => {
  return <span className="element-id">#{id}</span>;
};

export default ElementId;
