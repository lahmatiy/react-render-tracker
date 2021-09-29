import * as React from "react";
import { TransferArrayDiff, ValueTransition } from "../../types";
import { DiffSimple } from "./DiffSimple";

export function DiffArray({
  diff,
  values,
}: {
  diff: TransferArrayDiff;
  values: ValueTransition;
}) {
  const restChanges =
    diff.eqLeft > 0 || diff.eqRight > 0
      ? `${diff.eqLeft > 0 ? `first ${diff.eqLeft}` : ""}${
          diff.eqLeft > 0 && diff.eqRight > 0 ? " and " : ""
        }${diff.eqRight > 0 ? `last ${diff.eqRight}` : ""}${
          diff.eqLeft + diff.eqRight === 1 ? " element is" : " elements are"
        } equal`
      : "";

  return (
    <>
      <DiffSimple values={values} />
      {diff.prevLength !== diff.nextLength && (
        <div className="event-render-reason__diff-line">
          <span className="key">{"length "}</span>
          <DiffSimple
            values={{ prev: diff.prevLength, next: diff.nextLength }}
          />
        </div>
      )}
      {restChanges && (
        <span className="event-render-reason__diff-rest">{restChanges}</span>
      )}
    </>
  );
}
