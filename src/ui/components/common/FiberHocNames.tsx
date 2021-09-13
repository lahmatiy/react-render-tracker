import * as React from "react";

interface FiberHocNamesProps {
  names: string[] | null;
}

export default function FiberHocNames({ names }: FiberHocNamesProps) {
  if (!names || !names.length) {
    return null;
  }

  return (
    <span className="fiber-hoc-names">
      {names.map(name => (
        <span
          key={name}
          className="fiber-hoc-name"
          title="High Order Component (HOC)"
        >
          {name}
        </span>
      ))}
    </span>
  );
}
