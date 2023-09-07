import * as React from "react";
import { useSelectedId } from "../utils/selection";
import { useFiberTypeStat } from "../utils/fiber-maps";
import ComponentsTable from "./components/ComponentsTable";
import Toolbar from "./components/Toolbar";

function ComponentsPageBadge() {
  const { length: count } = useFiberTypeStat();
  return count || null;
}

function ComponentsPage() {
  const { selectedId } = useSelectedId();
  const [filter, setFilter] = React.useState<string>("");

  return (
    <div
      className="app-page app-page-components"
      data-has-selected={selectedId !== null || undefined}
    >
      <Toolbar filter={filter} setFilter={setFilter} />
      <div className="app-page-content-wrapper">
        <div className="app-page-content">
          <ComponentsTable filter={filter || null} />
        </div>
      </div>
    </div>
  );
}

const ComponentsPageBadgeMemo = React.memo(ComponentsPageBadge);
ComponentsPageBadgeMemo.displayName = "ComponentsPageBadge";

const ComponentsPageMemo = React.memo(ComponentsPage);
ComponentsPageMemo.displayName = "ComponentsPage";

export {
  ComponentsPageMemo as ComponentsPage,
  ComponentsPageBadgeMemo as ComponentsPageBadge,
};
