import * as React from "react";
import Toolbar from "./components/toolbar/Toolbar";
import RenderTree from "./components/render-tree/Tree";
import Details from "./components/details/Details";
import StatusBar from "./components/statusbar/StatusBar";
import { FindMatchContextProvider } from "./utils/find-match";
import {
  SelectedIdConsumer,
  SelectionContextProvider,
} from "./utils/selection";
import { EventsContextProvider } from "./utils/events";

function App() {
  const [filterPattern, setFilterPattern] = React.useState("");
  const [groupByParent, setGroupByParent] = React.useState(false);
  const [showUnmounted, setShowUnmounted] = React.useState(true);

  return (
    <EventsContextProvider>
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
              <StatusBar />
            </div>
          )}
        </SelectedIdConsumer>
      </SelectionContextProvider>
    </EventsContextProvider>
  );
}

export default App;
