import * as React from "react";
import { useComponentChildren } from "../../utils/componentMaps";
import { ViewSettings, ViewSettingsContext } from "./contexts";
import TreeElement, { TreeElementProps } from "./TreeLeaf";

const Tree = ({
  rootId = 0,
  groupByParent = false,
  showUnmounted = true,
  onSelect,
  selectedId,
  highlight,
}: Pick<TreeElementProps, "onSelect" | "selectedId" | "highlight"> & {
  groupByParent: boolean;
  showUnmounted: boolean;
  rootId: number;
}) => {
  const children = useComponentChildren(rootId);
  const viewSettings = React.useMemo<ViewSettings>(
    () => ({
      groupByParent,
      showUnmounted,
    }),
    [groupByParent, showUnmounted]
  );

  console.log("?!tree", [...children]);

  return (
    <div className="render-tree">
      <div className="render-tree__content">
        <ViewSettingsContext.Provider value={viewSettings}>
          {children.map(childId => (
            <TreeElement
              key={childId}
              componentId={childId}
              onSelect={onSelect}
              selectedId={selectedId}
              highlight={highlight}
            />
          ))}
        </ViewSettingsContext.Provider>
      </div>
    </div>
  );
};

export default Tree;
