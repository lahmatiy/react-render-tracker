import * as React from "react";
import { AppPage, AppPageConfig } from "../../pages";
import { Renderer } from "./Renderer";
import { useInspectMode } from "../../utils/highlighting";

const renderer = <Renderer />;
const AppBar = ({
  pages,
  page,
  setPage,
}: {
  pages: Record<AppPage, AppPageConfig>;
  page: AppPage;
  setPage: (page: AppPage) => void;
}) => {
  const { inspectMode, toggleInspect } = useInspectMode();

  return (
    <div className="app-bar">
      <div className="app-bar__prelude">
        <button
          className={`app-bar__pick-component${inspectMode ? " active" : ""}`}
          onClick={toggleInspect}
          title="Select a component in the page to inspect it"
        >
          &nbsp;
        </button>
      </div>
      {Object.values(pages).map(({ id, title, disabled, badge: Badge }) =>
        disabled ? (
          <React.Fragment key={id} />
        ) : (
          <div
            key={id}
            className={"app-bar__tab" + (page === id ? " selected" : "")}
            onClick={() => setPage(id)}
          >
            {title}
            {Badge ? (
              <span className="app-bar__tab-badge">
                <Badge />
              </span>
            ) : null}
          </div>
        )
      )}

      {renderer}
    </div>
  );
};

const AppbarMemo = React.memo(AppBar);
AppbarMemo.displayName = "AppBar";

export default AppbarMemo;
