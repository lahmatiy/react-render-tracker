import React, { useState, useMemo } from "react";

import { getTreeData, handleFilterDataElement } from "./data/helpers";
import { MessageElement } from "./types";

import Toolbar from "./components/toolbar/Toolbar";
import Details from "./components/details/Details";
import RenderTree from "./components/render-tree/Tree";

function App({ data }: { data: MessageElement[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterPattern, setFilterPattern] = useState("");
  const [groupByParent, setGroupByParent] = useState(false);
  const [showUnmounted, setShowUnmounted] = useState(true);

  const { componentById, roots } = useMemo(
    () => getTreeData(data || [], groupByParent),
    [data, groupByParent]
  );
  const filteredData = useMemo(
    () => handleFilterDataElement(roots, filterPattern, showUnmounted),
    [roots, filterPattern, showUnmounted]
  );
  const selectedComponent = componentById.get(selectedId) || null;

  return (
    <div
      className="app"
      data-has-selected={selectedComponent !== null || undefined}
    >
      <Toolbar
        onFilterPatternChange={setFilterPattern}
        filterPattern={filterPattern}
        onGroupingChange={setGroupByParent}
        groupByParent={groupByParent}
        onShowUnmounted={setShowUnmounted}
        showUnmounted={showUnmounted}
      />
      <RenderTree
        roots={filteredData}
        onSelect={setSelectedId}
        selectedId={selectedId}
        highlight={filterPattern.toLowerCase()}
      />
      {selectedComponent && <Details component={selectedComponent} />}
    </div>
  );
}

export default App;
