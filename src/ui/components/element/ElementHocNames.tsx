import React from "react";

export default function ElementHocNames({ names }: { names: string[] }) {
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
