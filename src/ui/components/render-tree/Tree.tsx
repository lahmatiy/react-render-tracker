import * as React from "react";
import { useFiberChildren } from "../../utils/fiber-maps";
import { useSelectedId } from "../../utils/selection";
import { getBoundingRect, getOverflowParent } from "../../utils/layout";
import TreeLeaf from "./TreeLeaf";
import {
  TreeViewSettings,
  TreeViewSettingsContext,
  useTreeViewSettingsContext,
} from "./contexts";

const ScrollSelectedToViewIfNeeded = () => {
  const { selectedId } = useSelectedId();
  const { getFiberElement } = useTreeViewSettingsContext();
  const element =
    selectedId !== null ? getFiberElement(selectedId) || null : null;

  React.useEffect(() => {
    if (element !== null) {
      const viewportEl = getOverflowParent(element);
      const elementRect = getBoundingRect(element, viewportEl);
      const scrollMarginTop =
        parseInt(
          getComputedStyle(element).getPropertyValue("scroll-margin-top"),
          10
        ) || 0;
      const scrollMarginLeft =
        parseInt(
          getComputedStyle(element).getPropertyValue("scroll-margin-left"),
          10
        ) || 0;

      const { scrollTop, scrollLeft, clientWidth, clientHeight } =
        viewportEl as HTMLElement;
      const viewportTop = scrollTop + scrollMarginTop;
      const viewportLeft = scrollLeft + scrollMarginLeft;
      const viewportRight = scrollLeft + clientWidth;
      const viewportBottom = scrollTop + clientHeight;
      const elementTop = scrollTop + elementRect.top;
      const elementLeft = scrollLeft + elementRect.left;
      const elementRight = elementLeft + elementRect.width;
      // const elementBottom = elementTop + elementRect.height;
      let scrollToTop = scrollTop;
      let scrollToLeft = scrollLeft;

      if (elementTop < viewportTop || elementTop > viewportBottom) {
        scrollToTop = elementTop - scrollMarginTop;
      }

      if (elementLeft < viewportLeft) {
        scrollToLeft = elementLeft - scrollMarginLeft;
      } else if (elementRight > viewportRight) {
        scrollToLeft =
          Math.max(elementLeft, scrollLeft - (elementRight - viewportRight)) -
          scrollMarginLeft;
      }

      viewportEl?.scrollTo(scrollToLeft, scrollToTop);
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
