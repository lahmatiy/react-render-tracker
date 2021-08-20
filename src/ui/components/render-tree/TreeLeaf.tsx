import React, { useState } from "react";
import { TreeElement } from "../../types";
import TreeElementCaption from "./TreeLeafCaption";

export interface TreeElementProps {
  data: TreeElement;
  root?: boolean;
  depth?: number;
  onSelect: (id: number) => void;
  selectedId: number | null;
  highlight: string;
}

const TreeElement = ({
  data,
  depth = 0,
  root = false,
  onSelect,
  selectedId,
  highlight,
}: TreeElementProps) => {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = data.children?.length > 0;
  const handleSetExpanded = hasChildren ? setExpanded : null;
  const handleSelect = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(data.id);
  };

  let classes = "tree-leaf";
  if (root) classes += " root";

  return (
    <div className={classes} onClick={handleSelect}>
      <TreeElementCaption
        depth={depth}
        data={data}
        selected={selectedId === data.id}
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
