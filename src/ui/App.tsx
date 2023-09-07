import * as React from "react";
import { FiberMapsContextProvider } from "./utils/fiber-maps";
import { EventsContextProvider } from "./utils/events";
import { SourceLocationsContextProvider } from "./utils/source-locations";
import { OpenFileContextProvider } from "./utils/open-file";
import { SelectionContextProvider } from "./utils/selection";
import { HighlightingContextProvider } from "./utils/highlighting";
import { PinnedContextProvider } from "./utils/pinned";
import {
  ReactRenderersContextProvider,
  useReactRenderers,
} from "./utils/react-renderers";
import WaitingForReady from "./components/misc/WaitingForReady";
import WaitingForRenderer from "./components/misc/WaitingForRenderer";
import AppBar from "./components/appbar/AppBar";
import StateBar from "./components/statebar/StateBar";
import StatusBar from "./components/statusbar/StatusBar";
import { pages } from "./pages";
import { MemoryLeaksContextProvider } from "./utils/memory-leaks";
import { PageContextProvider, usePageContext } from "./utils/page";

function App() {
  return (
    <PageContextProvider>
      <SourceLocationsContextProvider>
        <OpenFileContextProvider>
          <MemoryLeaksContextProvider>
            <ReactRenderersContextProvider>
              <WaitingForRenderer>
                <ReactRendererUI />
              </WaitingForRenderer>
            </ReactRenderersContextProvider>
          </MemoryLeaksContextProvider>
        </OpenFileContextProvider>
      </SourceLocationsContextProvider>
    </PageContextProvider>
  );
}

function ReactRendererUI() {
  const { selected: renderer } = useReactRenderers();

  const reactRendererUI = React.useMemo(
    () =>
      renderer && (
        <FiberMapsContextProvider key={renderer.id}>
          <EventsContextProvider channelId={renderer.channelId}>
            <SelectionContextProvider>
              <HighlightingContextProvider>
                <PinnedContextProvider>
                  <Layout />
                </PinnedContextProvider>
              </HighlightingContextProvider>
            </SelectionContextProvider>
          </EventsContextProvider>
        </FiberMapsContextProvider>
      ),
    [renderer]
  );

  if (reactRendererUI) {
    return reactRendererUI;
  }

  return null;
}

function Layout() {
  const { currentPage, openPage } = usePageContext();
  const PageContent = pages[currentPage].content;

  return (
    <div className="app">
      <AppBar pages={pages} page={currentPage} setPage={openPage} />

      <WaitingForReady>
        <PageContent />
      </WaitingForReady>

      <StateBar />

      <StatusBar />
    </div>
  );
}

export default App;
