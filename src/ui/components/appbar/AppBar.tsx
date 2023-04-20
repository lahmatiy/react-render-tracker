import * as React from "react";
import { AppPage, AppPageConfig } from "../../pages";
import { useReactRenderers } from "../../utils/react-renderers";

const AppBar = ({
  pages,
  page,
  setPage,
}: {
  pages: Record<AppPage, AppPageConfig>;
  page: AppPage;
  setPage: (page: AppPage) => void;
}) => {
  const { selected: selectedReactInstance } = useReactRenderers();

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

      <div
        className="renderer-info"
        title={
          selectedReactInstance
            ? `${selectedReactInstance?.name} v${selectedReactInstance?.version}`
            : undefined
        }
      >
        <span className="renderer-info__name">
          {selectedReactInstance?.name}
        </span>
        <span className="renderer-info__version">
          <span>{selectedReactInstance?.version}</span>
        </span>
      </div>
    </div>
  );
};

const AppbarMemo = React.memo(AppBar);
AppbarMemo.displayName = "AppBar";

export default AppbarMemo;
