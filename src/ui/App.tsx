import * as React from "react";
import { FiberMapsContextProvider } from "./utils/fiber-maps";
import { EventsContextProvider } from "./utils/events";
import { SourceLocationsContextProvider } from "./utils/source-locations";
import { OpenFileContextProvider } from "./utils/open-file";
import { SelectionContextProvider, useSelectedId } from "./utils/selection";
import { PinnedContextProvider, usePinnedId } from "./utils/pinned";
import { FindMatchContextProvider } from "./utils/find-match";
import Toolbar from "./components/toolbar/Toolbar";
import FiberTree from "./components/fiber-tree/Tree";
import FiberTreeHeader from "./components/fiber-tree/TreeHeader";
import Details from "./components/details/Details";
import StatusBar from "./components/statusbar/StatusBar";
import WaitingForReady from "./components/misc/WaitingForReady";
import WaitingForRenderer from "./components/misc/WaitingForRenderer";
import FiberTreeKeyboardNav from "./components/misc/FiberTreeKeyboardNav";
import {
  ReactRenderersContextProvider,
  useReactRenderers,
} from "./utils/react-renderers";

function App() {
  return (
    <SourceLocationsContextProvider>
      <OpenFileContextProvider>
        <ReactRenderersContextProvider>
          <ReactInstanceUI />
        </ReactRenderersContextProvider>
      </OpenFileContextProvider>
    </SourceLocationsContextProvider>
  );
}

function ReactInstanceUI() {
  const { selected } = useReactRenderers();
  const reactInstanceUI = React.useMemo(
    () =>
      selected && (
        <FiberMapsContextProvider key={selected.id}>
          <EventsContextProvider channelId={selected.channelId}>
            <SelectionContextProvider>
              <PinnedContextProvider>
                <WaitingForRenderer />
                <Layout />
              </PinnedContextProvider>
            </SelectionContextProvider>
          </EventsContextProvider>
        </FiberMapsContextProvider>
      ),
    [selected]
  );

  if (reactInstanceUI) {
    return reactInstanceUI;
  }

  return <WaitingForRenderer />;
}

function Layout() {
  const [groupByParent, setGroupByParent] = React.useState(false);
  const [showUnmounted, setShowUnmounted] = React.useState(true);
  const [showTimings, setShowTimings] = React.useState(false);
  const { selectedId } = useSelectedId();
  const { pinnedId } = usePinnedId();

  return (
    <div className="app" data-has-selected={selectedId !== null || undefined}>
      <FindMatchContextProvider>
        <Toolbar
          onGroupingChange={setGroupByParent}
          groupByParent={groupByParent}
          onShowUnmounted={setShowUnmounted}
          showUnmounted={showUnmounted}
          onShowTimings={setShowTimings}
          showTimings={showTimings}
        />

        <WaitingForReady />

        <FiberTreeHeader
          rootId={pinnedId}
          groupByParent={groupByParent}
          showTimings={showTimings}
        />
        <FiberTreeKeyboardNav
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
        />
        <FiberTree
          rootId={pinnedId}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
          showTimings={showTimings}
        />
      </FindMatchContextProvider>

      {selectedId !== null && (
        <Details
          rootId={selectedId}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
          showTimings={showTimings}
        />
      )}
      <StatusBar />
    </div>
  );
}

export default App;
