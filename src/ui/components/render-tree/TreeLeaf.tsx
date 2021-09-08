import * as React from "react";
import { useComponent, useComponentChildren } from "../../utils/component-maps";
import { useViewSettingsContext } from "./contexts";
import TreeElementCaption from "./TreeLeafCaption";

export interface TreeElementProps {
  componentId: number;
  depth?: number;
}

const TreeElement = React.memo(
  ({ componentId, depth = 0 }: TreeElementProps) => {
    const { groupByParent, showUnmounted, showTimings } =
      useViewSettingsContext();
    const component = useComponent(componentId);
    const children = useComponentChildren(
      componentId,
      groupByParent,
      showUnmounted
    );
    const [expanded, setExpanded] = React.useState(true);
    const hasChildren = children.length > 0;

    if (!component) {
      return null;
    }

    return (
      <div className="tree-leaf">
        <TreeElementCaption
          depth={Math.max(depth - 1, 0)}
          component={component}
          expanded={expanded}
          setExpanded={hasChildren ? setExpanded : undefined}
          showTimings={showTimings}
        />

        {expanded &&
          children.map(childId => (
            <TreeElement
              key={childId}
              componentId={childId}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }
);

TreeElement.displayName = "TreeElement";

export default TreeElement;
