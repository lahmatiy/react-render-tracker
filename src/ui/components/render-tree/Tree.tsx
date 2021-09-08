import * as React from "react";
import { useComponentChildren } from "../../utils/component-maps";
import { ViewSettings, ViewSettingsContext } from "./contexts";
import TreeElement from "./TreeLeaf";

const Tree = ({
  rootId = 0,
  groupByParent = false,
  showUnmounted = true,
  showTimings = false,
}: {
  rootId: number;
  groupByParent?: boolean;
  showUnmounted?: boolean;
  showTimings?: boolean;
}) => {
  const children = useComponentChildren(rootId, groupByParent, showUnmounted);
  const viewSettings = React.useMemo<ViewSettings>(
    () => ({
      groupByParent,
      showUnmounted,
      showTimings,
    }),
    [groupByParent, showUnmounted, showTimings]
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
