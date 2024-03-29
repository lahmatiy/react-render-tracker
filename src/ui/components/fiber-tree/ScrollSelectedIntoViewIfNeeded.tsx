import * as React from "react";
import { useSelectedId } from "../../utils/selection";
import { useHighlightedId } from "../../utils/highlighting";
import { getBoundingRect, getOverflowParent } from "../../utils/layout";
import { useTreeViewSettingsContext } from "./contexts";

export const ScrollFiberIntoViewIfNeeded = () => {
  const { selectedId } = useSelectedId();
  const { highlightedId } = useHighlightedId();
  const { getFiberElement } = useTreeViewSettingsContext();
  const { groupByParent, showUnmounted } = useTreeViewSettingsContext();

  React.useEffect(() => {
    const id = highlightedId || selectedId;
    const element =
      id !== null ? getFiberElement(id) || null : null;

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
  }, [selectedId, highlightedId, groupByParent, showUnmounted]);

  return null;
};
