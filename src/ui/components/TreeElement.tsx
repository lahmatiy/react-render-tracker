import React, { useState } from "react";
import { TreeElement } from "../types";
import ElementName from "./element/ElementName";
import ButtonCollapse from "./ui/ButtonCollapse";

interface ITreeElement {
  data: TreeElement;
  root?: boolean;
  onSelect: (id: number) => void;
  selectedId: number | null;
  highlight: string;
}

function byId(a: TreeElement, b: TreeElement) {
  return a.id - b.id;
}

const TreeElement = ({
  data,
  onSelect,
  root = false,
  selectedId,
  highlight,
}: ITreeElement) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const hasChildren = data.children?.length > 0;
  const handleToggle = hasChildren ? () => setIsCollapsed(prev => !prev) : null;
  const handleSelect = event => {
    event.stopPropagation();
    onSelect(data.id);
  };

  let classes = "tree-element__container";
  if (root) classes += " root";

  return (
    <div className={classes} onClick={handleSelect}>
      <ElementName
        data={data}
        isSelected={selectedId === data.id}
        isDisabled={!data.mounted}
        highlight={highlight}
      >
        <ButtonCollapse isCollapsed={isCollapsed} onToggle={handleToggle} />
      </ElementName>

      {isCollapsed &&
        hasChildren &&
        data.children
          .sort(byId)
          .map(child => (
            <TreeElement
              data={child}
              key={child.id}
              onSelect={onSelect}
              selectedId={selectedId}
              highlight={highlight}
            />
          ))}
    </div>
  );
};

export default TreeElement;
