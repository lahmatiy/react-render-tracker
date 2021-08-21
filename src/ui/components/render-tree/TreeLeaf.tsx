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

  // use a wrapper for proper styles, e.g. push-out effect for position:stycky instead of overlapping
  const isRenderRoot = data.ownerId === 0;
  const Wrapper = isRenderRoot ? "div" : React.Fragment;

  return (
    <Wrapper>
      <TreeElementCaption
        depth={Math.max(depth - 1, 0)}
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
    </Wrapper>
  );
};

export default TreeElement;
