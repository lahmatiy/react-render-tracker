import React, { useState } from "react";

import ElementName from "./element/ElementName";
import ButtonCollapse from "./ui/ButtonCollapse";

const TreeElement = ({ data, onSelect, root, selectedId, highlight }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSelect = event => {
    event.stopPropagation();
    onSelect(data);
  };

  let classes = "tree-element__container";
  if (root) classes += " root";

  const handleToggle = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className={classes} onClick={handleSelect}>
      <ElementName data={data} isSelected={selectedId === data.id} isDisabled={data.isUnmounted} highlight={highlight}>
        <ButtonCollapse isCollapsed={isCollapsed} onToggle={handleToggle} />
      </ElementName>

      {isCollapsed &&
        data.children.map(child => (
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
