import React, { useState } from "react";
import { TreeElement } from "../../types";
import { useComponent, useComponentChildren } from "../../utils/componentMaps";
import { useViewSettingsContext } from "./contexts";
import TreeElementCaption from "./TreeLeafCaption";

export interface TreeElementProps {
  componentId: number;
  depth?: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const TreeElement = React.memo(
  ({ componentId, depth = 0, selectedId, onSelect }: TreeElementProps) => {
    const { groupByParent, showUnmounted } = useViewSettingsContext();
    const component = useComponent(componentId);
    const children = useComponentChildren(componentId, groupByParent);
    const [expanded, setExpanded] = useState(true);
    const hasChildren = children.length > 0;
    console.log("TreeLeaf", component.id, children);

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
          selected={selectedId === componentId}
          onSelect={onSelect}
          expanded={expanded}
          setExpanded={hasChildren ? setExpanded : null}
        />

        {expanded &&
          children.map(childId => (
            <TreeElement
              key={childId}
              componentId={childId}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
      </Wrapper>
    );
  }
);

TreeElement.displayName = "TreeElement";

export default TreeElement;
