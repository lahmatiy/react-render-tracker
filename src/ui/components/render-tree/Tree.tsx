import * as React from "react";
import computeScrollIntoView from "compute-scroll-into-view";
import { useFiberChildren } from "../../utils/fiber-maps";
import { useSelectedId } from "../../utils/selection";
import {
  TreeViewSettings,
  TreeViewSettingsContext,
  useTreeViewSettingsContext,
} from "./contexts";
import TreeLeaf from "./TreeLeaf";

const ScrollSelectedToViewIfNeeded = () => {
  const { selectedId } = useSelectedId();
  const { getFiberElement } = useTreeViewSettingsContext();
  const element =
    selectedId !== null ? getFiberElement(selectedId) || null : null;

  React.useEffect(() => {
    if (element !== null) {
      const actions = computeScrollIntoView(element, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });

      if (actions.length) {
        element.scrollIntoView({ block: "start", inline: "nearest" });
      }
    }
  }, [element]);

  return null;
};

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
    <div className={"render-tree" + (showTimings ? " timings" : "")}>
      <div className="render-tree__scroll-area">
        <div className="render-tree__content">
          <TreeViewSettingsContext.Provider value={viewSettings}>
            {rootId !== 0 && children.length === 0 ? (
              <div className="render-tree__no-children">No children yet</div>
            ) : (
              children.map(childId => (
                <TreeLeaf
                  key={childId}
                  fiberId={childId}
                  depth={rootId === 0 ? 0 : 1}
                />
              ))
            )}
            <ScrollSelectedToViewIfNeeded />
          </TreeViewSettingsContext.Provider>
        </div>
      </div>
    </div>
  );
};

const TreeMemo = React.memo(Tree);
TreeMemo.displayName = "Tree";

export default TreeMemo;
