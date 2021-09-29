import * as React from "react";
import {
  TransferChangeDiff,
  TransferContextChange,
  TransferNamedEntryChange,
  ValueTransition,
} from "../../types";
import { useFiberMaps } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import { CallStack, CallStackList } from "./CallStack";
import { Diff } from "./Diff";

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
      prelude={entry.path && <CallStack path={entry.path} />}
      name={entry.name}
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
          <CallStackList paths={context.reads.map(read => read.path)} />
        )
      }
      name={
        <span className="event-render-reason__context-name">
          {entry.name || "UnknownContext"}
        </span>
      }
      index={entry.providerId}
      diff={entry.diff}
      values={entry}
    />
  );
}
