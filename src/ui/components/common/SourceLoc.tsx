import * as React from "react";
import { useOpenFile } from "../../utils/open-file";

function SourceLoc({
  loc,
  children,
}: {
  loc: string | null | undefined;
  children: React.ReactNode;
}) {
  const { openInEditor } = useOpenFile();

  if (!loc) {
    return <>{children}</>;
  }

  return (
    <span
      className={"source-loc" + (openInEditor ? " source-loc_openable" : "")}
      title={openInEditor ? `Open call location in editor: ${loc}` : loc}
      onClick={openInEditor ? () => openInEditor(loc) : undefined}
    >
      {children}
    </span>
  );
}

export default SourceLoc;
