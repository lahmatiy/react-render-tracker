import * as React from "react";
import { useSelectedId } from "../utils/selection";

export function MaybeLeaksPage() {
  const { selectedId } = useSelectedId();

  return (
    <div
      className="app-page app-page-components-tree"
      data-has-selected={selectedId !== null || undefined}
    >
      Maybe leaks
    </div>
  );
}
