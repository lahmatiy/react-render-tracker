import * as React from "react";
import {
  TransferArrayDiff,
  TransferNamedEntryChange,
  TransferObjectDiff,
} from "../../types";
import FiberId from "../common/FiberId";

interface EventRenderReasonsItemProps {
  type: "prop" | "state" | "context";
  data: TransferNamedEntryChange[];
}

function plural(value: number, one: string, many: string) {
  return value === 1 ? `${value} ${one}` : `${value} ${many}`;
}

function ShallowEqual() {
  return (
    <span className="event-render-reason__shallow-equal">
      Shallow equal (no difference in entries)
    </span>
  );
}

function SimpleDiff({ data }: { data: { prev?: any; next?: any } }) {
  return (
    <>
      <code className="removed">{data.prev}</code>
      &nbsp;→&nbsp;
      <code>{data.next}</code>
    </>
  );
}

function ObjectDiff({ diff }: { diff: TransferObjectDiff }) {
  const sampleSize = diff.sample.length;
  const restKeys = diff.keys - sampleSize;
  const restNotes =
    diff.diffKeys > sampleSize
      ? diff.keys === diff.diffKeys
        ? `… all the rest ${plural(
            restKeys,
            "entry is",
            "entries are"
          )} also changed`
        : `… +${diff.diffKeys - sampleSize} of the rest ${plural(
            diff.keys - sampleSize,
            "entry is",
            "entries are"
          )} also changed`
      : diff.keys > diff.diffKeys
      ? `… all the rest ${plural(
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
              <code className="removed">{entry.prev}</code>
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

function ArrayDiff({
  entry,
  diff,
}: {
  entry: TransferNamedEntryChange;
  diff: TransferArrayDiff;
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
      <SimpleDiff data={entry} />
      {diff.prevLength !== diff.nextLength && (
        <div className="event-render-reason__diff-line">
          <span className="key">{"length "}</span>
          <SimpleDiff data={{ prev: diff.prevLength, next: diff.nextLength }} />
        </div>
      )}
      {restChanges && (
        <span className="event-render-reason__diff-rest">{restChanges}</span>
      )}
    </>
  );
}

function CallStack({ path }: { path: string[] }) {
  const [collapsed, setCollapsed] = React.useState(true);
  const isFit = path.length === 2 && path[1].length < 12;

  if (collapsed && path.length > 1 && !isFit) {
    return (
      <span className="event-render-reason__value-change-path">
        {path[0] + " → "}
        <span
          className="event-render-reason__value-change-path-more"
          onClick={() => setCollapsed(false)}
        >
          …{path.length - 1} more…
        </span>
        {" → "}
      </span>
    );
  }

  return (
    <span className="event-render-reason__value-change-path">
      {path.join(" → ")}
      {" → "}
    </span>
  );
}

const EventRenderReasonsItem = ({
  type,
  data,
}: EventRenderReasonsItemProps) => {
  return (
    <>
      {data.map((entry, index) => {
        return (
          <div key={index} className="event-render-reason">
            <span className="event-render-reason__type-badge">{type}</span>{" "}
            {entry.path && <CallStack path={entry.path} />}
            {entry.name}
            {typeof entry.index === "number" && (
              <FiberId id={entry.index} />
            )}{" "}
            {typeof entry.diff === "object" ? (
              "keys" in entry.diff ? (
                <ObjectDiff diff={entry.diff} />
              ) : (
                <ArrayDiff diff={entry.diff} entry={entry} />
              )
            ) : (
              "prev" in entry && <SimpleDiff data={entry} />
            )}
            {entry.diff === false && <ShallowEqual />}
          </div>
        );
      })}
    </>
  );
};

export default EventRenderReasonsItem;
