import * as React from "react";

export function CallStack({
  path,
  expanded = false,
}: {
  path: string[];
  expanded?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(!expanded);
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

export function CallStackList({
  paths,
  expanded,
  compat = true,
}: {
  paths: Array<string[] | undefined>;
  expanded?: boolean;
  compat?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState<undefined | false>();

  if (compat && paths.length < 2) {
    return paths[0] ? <CallStack expanded={expanded} path={paths[0]} /> : null;
  }

  if (collapsed === undefined ? !expanded : collapsed) {
    return (
      <span
        className="event-render-reason__value-change-show-paths"
        onClick={() => setCollapsed(false)}
      >
        …{paths.length} paths…
      </span>
    );
  }

  return (
    <ol className="event-render-reason__value-change-path-list">
      {paths.map((path, index) => (
        <li key={index}>
          {path && (
            <CallStack
              path={path}
              expanded={collapsed !== undefined ? !collapsed : expanded}
            />
          )}
          useContext(…)
        </li>
      ))}
    </ol>
  );
}
