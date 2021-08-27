import * as React from "react";
import { useComponentChildren } from "../../utils/component-maps";
import { ViewSettings, ViewSettingsContext } from "./contexts";
import TreeElement from "./TreeLeaf";

const Tree = ({
  rootId = 0,
  groupByParent = false,
  showUnmounted = true,
}: {
  rootId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}) => {
  const children = useComponentChildren(rootId);
  const viewSettings = React.useMemo<ViewSettings>(
    () => ({
      groupByParent,
      showUnmounted,
    }),
    [groupByParent, showUnmounted]
  );

  return (
    <div className="render-tree">
      <div className="render-tree__content">
        <ViewSettingsContext.Provider value={viewSettings}>
          {children.map(childId => (
            <TreeElement key={childId} componentId={childId} />
          ))}
        </ViewSettingsContext.Provider>
      </div>
    </div>
  );
};

const TreeMemo = React.memo(Tree);
TreeMemo.displayName = "Tree";

export default TreeMemo;
