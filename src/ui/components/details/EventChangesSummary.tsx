import * as React from "react";
import { FiberChanges } from "../../types";

function getChangesSummary(changes: FiberChanges) {
  const { context, props, state } = changes;
  const reasons: string[] = [];

  if (props && props.length) {
    reasons.push("props");
  }

  if (context) {
    reasons.push("context");
  }

  if (state) {
    reasons.push("state");
  }

  return reasons.length > 0 ? reasons : null;
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
        (changes?.warnings ? " has-warnings" : "")
      }
      onClick={toggleExpanded}
    >
      {"± "}
      {changesSummary.map(reason => (
        <span key={reason} className="event-changes-summary-reason">
          {reason}
        </span>
      ))}
    </span>
  );
}
