import React, { useState } from "react";

import ElementName from "./element/ElementName";
import ButtonCollapse from "./ui/ButtonCollapse";

function byId(a, b) {
  return a.id - b.id;
}

const TreeElement = ({ data, onSelect, root, selectedId, highlight }) => {
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
        isDisabled={data.isUnmounted}
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
