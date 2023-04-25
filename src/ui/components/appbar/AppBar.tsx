import * as React from "react";
import { AppPage, AppPageConfig } from "../../pages";
import { Renderer } from "./Renderer";

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
  return (
    <div className="app-bar">
      {Object.values(pages).map(({ id, title, badge: Badge }) => (
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
      ))}

      {renderer}
    </div>
  );
};

const AppbarMemo = React.memo(AppBar);
AppbarMemo.displayName = "AppBar";

export default AppbarMemo;
