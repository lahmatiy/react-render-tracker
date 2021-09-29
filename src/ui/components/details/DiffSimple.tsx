import * as React from "react";
import { ValueTransition } from "../../types";

export function DiffSimple({ values }: { values: ValueTransition }) {
  return (
    <>
      <code className="removed">{values.prev}</code>
      &nbsp;→&nbsp;
      <code>{values.next}</code>
    </>
  );
}
