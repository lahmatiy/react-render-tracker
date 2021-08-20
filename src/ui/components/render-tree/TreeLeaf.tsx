import React, { useState } from "react";
import { TreeElement } from "../../types";
import TreeElementCaption from "./TreeLeafCaption";

export interface TreeElementProps {
  data: TreeElement;
  depth?: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  highlight: string;
}

const TreeElement = ({
  data,
  depth = 0,
  selectedId,
  onSelect,
  highlight,
}: TreeElementProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = data.children?.length > 0;
  const handleSetExpanded = hasChildren ? setExpanded : null;

  return (
    <div>
      <TreeElementCaption
        depth={depth}
        data={data}
        selected={selectedId === data.id}
        onSelect={onSelect}
        unmounted={!data.mounted}
        expanded={expanded}
        setExpanded={handleSetExpanded}
        highlight={highlight}
      />

      {expanded &&
        hasChildren &&
        data.children.map(child => (
          <TreeElement
            key={child.id}
            data={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            highlight={highlight}
          />
        ))}
    </div>
  );
};

export default TreeElement;
