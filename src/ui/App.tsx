import * as React from "react";
import Toolbar from "./components/toolbar/Toolbar";
import Details from "./components/details/Details";
import RenderTree from "./components/render-tree/Tree";
import { FindMatchContextProvider } from "./utils/find-match";
import { useGlobalMaps } from "./utils/global-maps";
import {
  SelectedIdConsumer,
  SelectionContextProvider,
} from "./utils/selection";

function App() {
  const [filterPattern, setFilterPattern] = React.useState("");
  const [groupByParent, setGroupByParent] = React.useState(false);
  const [showUnmounted, setShowUnmounted] = React.useState(true);

  const { clearEventLog } = useGlobalMaps();

  return (
    <SelectionContextProvider>
      <SelectedIdConsumer>
        {(selectedId: number | null) => (
          <div
            className="app"
            data-has-selected={selectedId !== null || undefined}
          >
            <Toolbar
              onFilterPatternChange={setFilterPattern}
              filterPattern={filterPattern}
              onGroupingChange={setGroupByParent}
              groupByParent={groupByParent}
              onShowUnmounted={setShowUnmounted}
              showUnmounted={showUnmounted}
              onClearEventLog={clearEventLog}
            />

            <FindMatchContextProvider pattern={filterPattern}>
              <RenderTree
                rootId={0}
                groupByParent={groupByParent}
                showUnmounted={showUnmounted}
              />
            </FindMatchContextProvider>
            {selectedId !== null && (
              <Details
                componentId={selectedId}
                groupByParent={groupByParent}
                showUnmounted={showUnmounted}
              />
            )}
          </div>
        )}
      </SelectedIdConsumer>
    </SelectionContextProvider>
  );
}

export default App;
