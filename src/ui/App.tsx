import * as React from "react";
import Toolbar from "./components/toolbar/Toolbar";
import Details from "./components/details/Details";
import RenderTree from "./components/render-tree/Tree";

function App() {
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [filterPattern, setFilterPattern] = React.useState("");
  const [groupByParent, setGroupByParent] = React.useState(false);
  const [showUnmounted, setShowUnmounted] = React.useState(true);

  return (
    <div className="app" data-has-selected={selectedId !== null || undefined}>
      <Toolbar
        onFilterPatternChange={setFilterPattern}
        filterPattern={filterPattern}
        onGroupingChange={setGroupByParent}
        groupByParent={groupByParent}
        onShowUnmounted={setShowUnmounted}
        showUnmounted={showUnmounted}
      />
      <RenderTree
        rootId={0}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
        onSelect={setSelectedId}
        selectedId={selectedId}
        highlight={filterPattern.toLowerCase()}
      />
      {selectedId !== null && <Details componentId={selectedId} />}
    </div>
  );
}

export default App;
