import React, { useState } from "react";
import ChevronDown from "react-feather/dist/icons/chevron-down";

import ElementName from "./element/ElementName";

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
        <button
          className={`tree-element__toggle ${isCollapsed ? "open" : ""}`}
          onClick={handleToggle}
        >
          <ChevronDown />
        </button>
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
