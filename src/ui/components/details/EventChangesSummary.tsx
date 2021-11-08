import * as React from "react";
import {
  FiberChanges,
  FiberContextChange,
  FiberStateChange,
} from "../../types";

function isShallowEqual(entry: FiberContextChange | FiberStateChange) {
  return entry.diff === false;
}

function getChangesSummary(changes: FiberChanges) {
  const { context, props, state } = changes;
  const reasons: string[] = [];
  let hasShallowEqual = false;

  if (props && props.length) {
    reasons.push("props");
  }

  if (context) {
    reasons.push("context");
    hasShallowEqual ||= context.some(isShallowEqual);
  }

  if (state) {
    reasons.push("state");
    hasShallowEqual ||= state.some(isShallowEqual);
  }

  return reasons.length > 0 ? { reasons, hasShallowEqual } : null;
}

export function EventChangesSummary({
  changes = null,
  expanded = false,
  toggleExpanded,
}: {
  changes: FiberChanges | null;
  expanded?: boolean;
  toggleExpanded?: () => void;
}) {
  const changesSummary = changes !== null ? getChangesSummary(changes) : null;

  if (changesSummary === null) {
    return null;
  }

  return (
    <span
      className={
        "event-changes-summary" +
        (expanded ? " expanded" : "") +
        (changesSummary.hasShallowEqual ? " has-warnings" : "")
      }
      onClick={toggleExpanded}
    >
      {"± "}
      {changesSummary.reasons.map(reason => (
        <span key={reason} className="event-changes-summary-reason">
          {reason}
        </span>
      ))}
    </span>
  );
}
