import * as React from "react";
import { TransferObjectDiff } from "../../../types";
import { DiffSimple } from "./DiffSimple";

function plural(value: number, one: string, many: string) {
  return value === 1 ? `${value} ${one}` : `${value} ${many}`;
}

export function DiffObject({ diff }: { diff: TransferObjectDiff }) {
  const sampleSize = diff.sample.length;
  const restKeys = diff.keys - sampleSize;
  const restNotes =
    restKeys === 0
      ? false
      : diff.diffKeys <= sampleSize
      ? `… all the rest ${plural(
          restKeys,
          "entry has",
          "entries have"
        )} not changed`
      : diff.keys === diff.diffKeys
      ? `… all the rest ${plural(
          restKeys,
          "entry is",
          "entries are"
        )} also changed`
      : `… ${diff.diffKeys - sampleSize} of the rest ${plural(
          restKeys,
          "entry",
          "entries"
        )} ${diff.diffKeys - sampleSize === 1 ? "is" : "are"} also changed`;

  return (
    <>
      <span className="diff-bracket">{"{"}</span>
      {diff.sample.map(values => {
        const key = <span className="key">{`${values.name}: `}</span>;

        if ("prev" in values === false) {
          return (
            <div key={values.name} className="diff-line added">
              {key}
              <code className="diff-value">{values.next}</code>
            </div>
          );
        }

        if ("next" in values === false) {
          return (
            <div key={values.name} className="diff-line removed">
              {key}
              <code className="diff-value removed">{values.prev}</code>
            </div>
          );
        }

        return (
          <div key={values.name} className="diff-line">
            {key}
            <DiffSimple values={values} />
          </div>
        );
      })}
      {restNotes && <span className="diff-rest">{restNotes}</span>}
      <span className="diff-bracket">{"}"}</span>
    </>
  );
}
