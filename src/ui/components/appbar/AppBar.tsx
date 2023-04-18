import * as React from "react";
import { AppPageId, AppPage } from "../../pages";
import { useReactRenderers } from "../../utils/react-renderers";

const AppBar = ({
  pages,
  page,
  setPage,
}: {
  pages: Record<AppPageId, AppPage>;
  page: AppPageId;
  setPage: (page: AppPageId) => void;
}) => {
  const { selected: selectedReactInstance } = useReactRenderers();

  return (
    <div className="app-bar">
      {Object.values(pages).map(({ id, title }) => (
        <div
          key={id}
          className={"app-bar__tab" + (page === id ? " selected" : "")}
          onClick={() => setPage(id)}
        >
          {title}
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
