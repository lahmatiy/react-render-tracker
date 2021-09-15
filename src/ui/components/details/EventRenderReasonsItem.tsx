import * as React from "react";
import { TransferNamedEntryChange, TransferObjectDiff } from "../../types";

interface EventRenderReasonsItemProps {
  type: "prop" | "state" | "context";
  data: TransferNamedEntryChange[];
}

function plural(value: number, one: string, many: string) {
  return value === 1 ? `${value} ${one}` : `${value} ${many}`;
}

function SimpleDiff({ data }: { data: { prev?: any; next?: any } }) {
  return (
    <>
      <code>{data.prev}</code>
      &nbsp;→&nbsp;
      <code>{data.next}</code>
    </>
  );
}

function ExtendedDiff({ diff }: { diff: TransferObjectDiff }) {
  const sampleSize = diff.sample.length;
  const restKeys = diff.keys - sampleSize;
  const restNotes =
    diff.diffKeys > sampleSize
      ? diff.keys === diff.diffKeys
        ? restKeys === 1
          ? "… the rest 1 entry is also changed"
          : `… other ${restKeys} entries are also changed`
        : `… the rest ${diff.diffKeys - sampleSize} of ${
            diff.keys - sampleSize
          } entries are changed`
      : diff.keys > diff.diffKeys
      ? `… the rest ${plural(
          diff.keys - sampleSize,
          "entry has",
          "entries have"
        )} not changed`
      : false;

  return (
    <>
      <span className="event-render-reason__diff-bracket">{"{"}</span>
      {diff.sample.map(entry => {
        const key = <span className="key">{`${entry.name}: `}</span>;

        if ("prev" in entry === false) {
          return (
            <div
              key={entry.name}
              className="event-render-reason__diff-line added"
            >
              {key}
              <code>{entry.next}</code>
            </div>
          );
        }

        if ("next" in entry === false) {
          return (
            <div
              key={entry.name}
              className="event-render-reason__diff-line removed"
            >
              {key}
              <code>{entry.prev}</code>
            </div>
          );
        }

        return (
          <div key={entry.name} className="event-render-reason__diff-line">
            {key}
            <SimpleDiff data={entry} />
          </div>
        );
      })}
      {restNotes && (
        <span className="event-render-reason__diff-rest">{restNotes}</span>
      )}
      <span className="event-render-reason__diff-bracket">{"}"}</span>
    </>
  );
}

const EventRenderReasonsItem = ({
  type,
  data,
}: EventRenderReasonsItemProps) => {
  return (
    <>
      {data.map((row, index) => {
        return (
          <tr key={index} className="event-render-reason">
            <td className="event-render-reason__type">
              <span className="event-render-reason__type-badge">{type}</span>
            </td>
            <td className="event-render-reason__value-change">
              {row.name + " "}
              {typeof row.diff === "object" ? (
                <ExtendedDiff diff={row.diff} />
              ) : (
                "prev" in row && <SimpleDiff data={row} />
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default EventRenderReasonsItem;
