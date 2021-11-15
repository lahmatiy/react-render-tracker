import * as React from "react";
import { LocType } from "../../types";
import { useOpenFile } from "../../utils/open-file";
import { useResolvedLocation } from "../../utils/source-locations";

export function SourceLoc({
  loc,
  type,
  children,
}: {
  loc: string | null | undefined;
  type?: LocType;
  children: React.ReactNode;
}) {
  const { anchorAttrs } = useOpenFile();

  if (!loc) {
    return <>{children}</>;
  }

  const attrs = anchorAttrs(loc, type);

  if (!attrs) {
    return (
      <span className="source-loc" title={loc}>
        {children}
      </span>
    );
  }

  return (
    <a
      className="source-loc source-loc_openable"
      title={`Open source location: ${attrs.href}`}
      {...attrs}
    >
      {children}
    </a>
  );
}

export function ResolveSourceLoc({
  loc,
  type,
  children,
}: {
  loc: string | null | undefined;
  type?: LocType;
  children: React.ReactNode;
}) {
  const resolvedLoc = useResolvedLocation(loc);

  if (!loc) {
    return <>{children}</>;
  }

  if (!resolvedLoc) {
    return (
      <span className="source-loc source-loc_unresolved" title="Resolving...">
        {children}
      </span>
    );
  }

  return (
    <SourceLoc type={type} loc={resolvedLoc}>
      {children}
    </SourceLoc>
  );
}
