import * as React from "react";
import { useFiberChildren } from "../../utils/fiber-maps";
import { ScrollSelectedIntoViewIfNeeded } from "./ScrollSelectedIntoViewIfNeeded";
import TreeLeaf from "./TreeLeaf";
import { TreeViewSettings, TreeViewSettingsContext } from "./contexts";

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
  const children = useFiberChildren(rootId, groupByParent, showUnmounted);
  const viewSettings = React.useMemo<TreeViewSettings>(() => {
    const fiberElementById = new Map<number, HTMLElement>();

    return {
      setFiberElement: (id, element) =>
        element
          ? fiberElementById.set(id, element)
          : fiberElementById.delete(id),
      getFiberElement: id => fiberElementById.get(id) || null,
      groupByParent,
      showUnmounted,
      showTimings,
    };
  }, [groupByParent, showUnmounted, showTimings]);

  return (
    <div className={"fiber-tree" + (showTimings ? " timings" : "")}>
      <div className="fiber-tree__scroll-area">
        <div className="fiber-tree__content">
          <TreeViewSettingsContext.Provider value={viewSettings}>
            {rootId !== 0 && children.length === 0 ? (
              <div className="fiber-tree__no-children">No children yet</div>
            ) : (
              children.map(childId => (
                <TreeLeaf
                  key={childId}
                  fiberId={childId}
                  depth={rootId === 0 ? 0 : 1}
                />
              ))
            )}
            <ScrollSelectedIntoViewIfNeeded />
          </TreeViewSettingsContext.Provider>
        </div>
      </div>
    </div>
  );
};

const TreeMemo = React.memo(Tree);
TreeMemo.displayName = "Tree";

export default TreeMemo;
