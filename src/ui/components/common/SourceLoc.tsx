import * as React from "react";
import { useOpenFile } from "../../utils/open-file";
import { useResolvedLocation } from "../../utils/source-locations";

function SourceLoc({
  loc,
  children,
}: {
  loc: string | null | undefined;
  children: React.ReactNode;
}) {
  const { anchorAttrs } = useOpenFile();
  const resolvedLoc = useResolvedLocation(loc);

  if (!resolvedLoc) {
    return <>{children}</>;
  }

  const attrs = anchorAttrs(resolvedLoc);

  if (!attrs) {
    return (
      <span className="source-loc" title={resolvedLoc}>
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

export default SourceLoc;
