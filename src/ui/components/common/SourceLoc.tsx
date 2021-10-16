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
  const { openInEditor } = useOpenFile();
  const resolvedLoc = useResolvedLocation(loc);

  if (!resolvedLoc) {
    return <>{children}</>;
  }

  if (!openInEditor) {
    return (
      <span className="source-loc" title={resolvedLoc}>
        {children}
      </span>
    );
  }

  return (
    <a
      className="source-loc source-loc_openable"
      href={
        "vscode://file/Users/romandvornov/Developer/react-render-tracker/" +
        resolvedLoc
      }
    >
      {children}
    </a>
  );

  return (
    <span
      className="source-loc source-loc_openable"
      title={`Open location in editor: ${resolvedLoc}`}
      onClick={() => openInEditor(resolvedLoc)}
    >
      {children}
    </span>
  );
}

export default SourceLoc;
