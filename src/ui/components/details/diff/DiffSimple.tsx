import * as React from "react";
import { ValueTransition } from "../../../types";

export function DiffSimple({ values }: { values: ValueTransition }) {
  return (
    <>
      <code className="diff-value removed">{values.prev}</code>
      &nbsp;→&nbsp;
      <code className="diff-value">{values.next}</code>
    </>
  );
}
