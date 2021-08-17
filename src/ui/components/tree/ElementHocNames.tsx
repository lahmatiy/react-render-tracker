import React from "react";

interface ElementHocNamesProps {
  names: string[];
}

export default function ElementHocNames({ names }: ElementHocNamesProps) {
  if (!names || !names.length) {
    return null;
  }

  return (
    <span className="tree-element-hoc-names">
      {names.map(name => (
        <span key={name} className="tree-element-hoc-name">
          {name}
        </span>
      ))}
    </span>
  );
}
