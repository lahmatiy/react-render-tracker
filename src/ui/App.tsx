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
import StatusBar from "./components/statusbar/StatusBar";
import WaitingForReady from "./components/misc/WaitingForReady";
import WaitingForRenderer from "./components/misc/WaitingForRenderer";
import AppBar from "./components/appbar/AppBar";
import { AppPage, pages } from "./pages";
import { MemoryLeaksApiContextProvider } from "./utils/memory-leaks";

function App() {
  return (
    <SourceLocationsContextProvider>
      <OpenFileContextProvider>
        <MemoryLeaksApiContextProvider>
          <ReactRenderersContextProvider>
            <WaitingForRenderer>
              <ReactRendererUI />
            </WaitingForRenderer>
          </ReactRenderersContextProvider>
        </MemoryLeaksApiContextProvider>
      </OpenFileContextProvider>
    </SourceLocationsContextProvider>
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
  const [page, setPage] = React.useState<AppPage>(AppPage.ComponentTree);
  const PageContent = pages[page].content;

  return (
    <div className="app">
      <AppBar pages={pages} page={page} setPage={setPage} />

      <WaitingForReady>
        <PageContent />
      </WaitingForReady>

      <StatusBar />
    </div>
  );
}

export default App;
