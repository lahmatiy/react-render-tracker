import * as React from "react";
import {
  FiberContextChange,
  TransferChangeDiff,
  ValueTransition,
  TransferPropChange,
  FiberStateChange,
} from "../../../types";
import { useFiberMaps } from "../../../utils/fiber-maps";
import FiberId from "../../common/FiberId";
import SourceLoc from "../../common/SourceLoc";
import { CallTracePath, CallTraceList } from "../CallStack";
import { Diff } from "../diff/Diff";
import { FiberLink } from "../FiberLink";

function Change({
  type,
  prelude,
  name,
  index,
  diffPrelude,
  diff,
  values,
}: {
  type: string;
  prelude?: React.ReactNode;
  name: React.ReactNode | string;
  index?: number;
  diffPrelude?: React.ReactNode;
  diff?: TransferChangeDiff;
  values: ValueTransition;
}) {
  return (
    <div key={index} className="event-render-reason">
      <span className="event-render-reason__type-badge">{type}</span>
      {prelude}
      {name}
      {typeof index === "number" && <FiberId id={index} />} {diffPrelude}
      <Diff diff={diff} values={values} />
    </div>
  );
}

export function PropChange({ entry }: { entry: TransferPropChange }) {
  return (
    <Change type="prop" name={entry.name} diff={entry.diff} values={entry} />
  );
}

export function StateChange({ entry }: { entry: FiberStateChange }) {
  if (!entry.hook) {
    debugger;
  }
  return (
    <Change
      type="state"
      prelude={entry.hook && <CallTracePath path={entry.hook.trace.path} />}
      name={
        entry.hook && (
          <SourceLoc loc={entry.hook.trace.loc}>{entry.hook.name}</SourceLoc>
        )
      }
      index={entry.hook?.index}
      diffPrelude={
        entry.calls && (
          <span style={{ color: "#888", fontSize: "11px" }}>
            {" "}
            [[
            {entry.calls.map((entry, idx) => (
              <SourceLoc key={idx} loc={entry.loc}>
                {entry.name}
              </SourceLoc>
            ))}
            ]]{" "}
          </span>
        )
      }
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
  entry: FiberContextChange;
}) {
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);
  const context = entry.context;
  const contextReads =
    context !== null
      ? fiber?.typeDef.hooks.filter(hook => hook.context === context)
      : null;

  return (
    <Change
      type="context"
      prelude={
        contextReads?.length && (
          <CallTraceList traces={contextReads.map(hook => hook.trace)} />
        )
      }
      name={
        typeof context?.providerId === "number" ? (
          <FiberLink id={context?.providerId} name={context.name} />
        ) : (
          context?.name || "UnknownContext"
        )
      }
      diff={entry.diff}
      values={entry}
    />
  );
}
