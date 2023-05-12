import * as React from "react";
import { useSelectedId } from "../utils/selection";
import { useLeakedFibers } from "../utils/fiber-maps";
import Toolbar from "./maybe-leaks/Toolbar";
import { LeaksList } from "./maybe-leaks/LeaksList";

function MaybeLeaksPageBadge() {
  const leakedFibers = useLeakedFibers();
  return <>{leakedFibers.length || ""}</>;
}

function MaybeLeaksPage() {
  const [groupByParent, setGroupByParent] = React.useState(false);
  const [showUnmounted, setShowUnmounted] = React.useState(true);
  const [showTimings, setShowTimings] = React.useState(false);
  const { selectedId } = useSelectedId();

  return (
    <div
      className="app-page app-page-maybe-leaks"
      data-has-selected={selectedId !== null || undefined}
    >
      <Toolbar
        onGroupingChange={setGroupByParent}
        groupByParent={groupByParent}
        onShowUnmounted={setShowUnmounted}
        showUnmounted={showUnmounted}
        onShowTimings={setShowTimings}
        showTimings={showTimings}
      />
      <div className="app-page-content">
        <LeaksList />
      </div>
    </div>
  );
}

const MaybeLeaksPageBadgeMemo = React.memo(MaybeLeaksPageBadge);
MaybeLeaksPageBadgeMemo.displayName = "MaybeLeaksPageBadge";

const MaybeLeaksPageMemo = React.memo(MaybeLeaksPage);
MaybeLeaksPageMemo.displayName = "MaybeLeaksPage";

export {
  MaybeLeaksPageMemo as MaybeLeaksPage,
  MaybeLeaksPageBadgeMemo as MaybeLeaksPageBadge,
};
