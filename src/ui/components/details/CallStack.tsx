import * as React from "react";
import { TransferCallTrace, TransferCallTracePoint } from "../../types";
import SourceLoc from "../common/SourceLoc";

export function CallTracePath({
  path,
  expanded = false,
}: {
  path: TransferCallTracePoint[] | null | undefined;
  expanded?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(!expanded);

  if (!Array.isArray(path)) {
    return null;
  }

  const isFit = path.length === 2 && path[1].name.length < 12;

  if (collapsed && path.length > 1 && !isFit) {
    const first = path[0];

    return (
      <span className="details-call-stack">
        <SourceLoc loc={first.loc}>{first.name}</SourceLoc>
        {" → "}
        <span
          className="details-call-stack-more"
          onClick={() => setCollapsed(false)}
        >
          …{path.length - 1} more…
        </span>
        {" → "}
      </span>
    );
  }

  return (
    <span className="details-call-stack">
      {path.map((entry, index) => (
        <React.Fragment key={index}>
          <SourceLoc loc={entry.loc}>{entry.name}</SourceLoc>
          {" → "}
        </React.Fragment>
      ))}
    </span>
  );
}

export function CallTraceList({
  traces,
  expanded,
  compat = true,
}: {
  traces: TransferCallTrace[];
  expanded?: boolean;
  compat?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState<undefined | false>();

  if (compat && traces.length < 2) {
    return <CallTracePath expanded={expanded} path={traces[0]?.path} />;
  }

  if (collapsed === undefined ? !expanded : collapsed) {
    return (
      <span>
        <span
          className="details-call-stack-show-paths"
          onClick={() => setCollapsed(false)}
        >
          …{traces.length} paths…
        </span>
      </span>
    );
  }

  return (
    <ol className="details-call-stack-list">
      {traces.map((trace, index) => (
        <li key={index}>
          <CallTracePath
            path={trace?.path}
            expanded={collapsed !== undefined ? !collapsed : expanded}
          />
          <SourceLoc loc={trace?.loc}>useContext(…)</SourceLoc>
        </li>
      ))}
    </ol>
  );
}
