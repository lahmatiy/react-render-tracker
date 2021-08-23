import React, { useState } from "react";
import { TreeElement } from "../../types";
import { useComponent, useComponentChildren } from "../../utils/global-maps";
import { useViewSettingsContext } from "./contexts";
import TreeElementCaption from "./TreeLeafCaption";

export interface TreeElementProps {
  componentId: number;
  depth?: number;
}

const TreeElement = React.memo(
  ({ componentId, depth = 0 }: TreeElementProps) => {
    const { groupByParent, showUnmounted } = useViewSettingsContext();
    const component = useComponent(componentId);
    const children = useComponentChildren(
      componentId,
      groupByParent,
      showUnmounted
    );
    const [expanded, setExpanded] = useState(true);
    const hasChildren = children.length > 0;

    if (!component.mounted && !showUnmounted) {
      return null;
    }

    // use a wrapper for proper styles, e.g. push-out effect for position:stycky instead of overlapping
    const isRenderRoot = component.ownerId === 0;
    const Wrapper = isRenderRoot ? "div" : React.Fragment;

    return (
      <Wrapper>
        <TreeElementCaption
          depth={Math.max(depth - 1, 0)}
          component={component}
          expanded={expanded}
          setExpanded={hasChildren ? setExpanded : null}
        />

        {expanded &&
          children.map(childId => (
            <TreeElement
              key={childId}
              componentId={childId}
              depth={depth + 1}
            />
          ))}
      </Wrapper>
    );
  }
);

TreeElement.displayName = "TreeElement";

export default TreeElement;
