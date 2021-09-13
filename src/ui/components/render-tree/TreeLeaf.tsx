import * as React from "react";
import { useFiber, useFiberChildren } from "../../utils/fiber-maps";
import { useViewSettingsContext } from "./contexts";
import TreeLeafCaption from "./TreeLeafCaption";

export interface TreeLeafProps {
  fiberId: number;
  depth?: number;
}

const TreeLeaf = React.memo(({ fiberId, depth = 0 }: TreeLeafProps) => {
  const { groupByParent, showUnmounted, showTimings } =
    useViewSettingsContext();
  const fiber = useFiber(fiberId);
  const children = useFiberChildren(fiberId, groupByParent, showUnmounted);
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = children.length > 0;

  if (!fiber) {
    return null;
  }

  return (
    <div className="tree-leaf">
      <TreeLeafCaption
        depth={Math.max(depth - 1, 0)}
        fiber={fiber}
        expanded={expanded}
        setExpanded={hasChildren ? setExpanded : undefined}
        showTimings={showTimings}
      />

      {expanded &&
        children.map(childId => (
          <TreeLeaf key={childId} fiberId={childId} depth={depth + 1} />
        ))}
    </div>
  );
});

TreeLeaf.displayName = "TreeLeaf";

export default TreeLeaf;
