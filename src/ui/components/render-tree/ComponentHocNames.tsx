import React from "react";

interface ComponentHocNamesProps {
  names: string[] | null;
}

export default function ComponentHocNames({ names }: ComponentHocNamesProps) {
  if (!names || !names.length) {
    return null;
  }

  return (
    <span className="component-hoc-names">
      {names.map(name => (
        <span key={name} className="component-hoc-name">
          {name}
        </span>
      ))}
    </span>
  );
}
