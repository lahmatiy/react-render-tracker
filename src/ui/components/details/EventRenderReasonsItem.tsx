import * as React from "react";
import {
  TransferChangeDiff,
  TransferContextChange,
  TransferNamedEntryChange,
  ValueTransition,
} from "../../types";
import { useFiberMaps } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import SourceLoc from "../common/SourceLoc";
import { CallTracePath, CallTraceList } from "./CallStack";
import { Diff } from "./Diff";
import { FiberLink } from "./FiberLink";

function Change({
  type,
  prelude,
  name,
  index,
  diff,
  values,
}: {
  type: string;
  prelude?: JSX.Element;
  name: JSX.Element | string;
  index?: number;
  diff?: TransferChangeDiff;
  values: ValueTransition;
}) {
  return (
    <div key={index} className="event-render-reason">
      <span className="event-render-reason__type-badge">{type}</span>
      {prelude}
      {name}
      {typeof index === "number" && <FiberId id={index} />}{" "}
      <Diff diff={diff} values={values} />
      <span className="event-render-reason__diff">
        <Diff diff={diff} values={values} />
      </span>
    </div>
  );
}

export function PropChange({ entry }: { entry: TransferNamedEntryChange }) {
  return (
    <Change type="prop" name={entry.name} diff={entry.diff} values={entry} />
  );
}

export function StateChange({ entry }: { entry: TransferNamedEntryChange }) {
  return (
    <Change
      type="state"
      prelude={<CallTracePath path={entry.trace?.path} />}
      name={<SourceLoc loc={entry.trace?.loc}>{entry.name}</SourceLoc>}
      index={entry.index}
      diff={entry.diff}
      values={entry}
    />
  );
}

export function ContextChange({
  fiberId,
  entry,
}: {
  fiberId: number;
  entry: TransferContextChange;
}) {
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);
  const context =
    entry.providerId !== undefined
      ? fiber?.contexts?.find(
          context => context.providerId === entry.providerId
        )
      : null;

  return (
    <Change
      type="context"
      prelude={
        context?.reads && (
          <CallTraceList traces={context.reads.map(read => read.trace)} />
        )
      }
      name={
        typeof entry.providerId === "number" ? (
          <FiberLink id={entry.providerId} name={entry.name} />
        ) : (
          entry.name || "UnknownContext"
        )
      }
      diff={entry.diff}
      values={entry}
    />
  );
}
