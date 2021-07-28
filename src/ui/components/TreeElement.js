import React, { useState } from 'react';
import { ChevronDown } from 'react-feather';

import ElementName from './element/ElementName';

const TreeElement = ({ data, onSelect, root, selectedId }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSelect = event => {
    event.stopPropagation();
    onSelect(data);
  }

  let classes = 'tree-element__container';
  if (root) classes += ' root';

  const handleToggle = () => {
    setIsCollapsed(prev => !prev);
  }

  return (
    <div className={classes} onClick={handleSelect}>
      <ElementName data={data} isSelected={selectedId === data.id}>
        <button className={`tree-element__toggle ${isCollapsed ? 'open' : ''}`} onClick={handleToggle}>
          <ChevronDown />
        </button>
      </ElementName>
      {isCollapsed && data.children.map(child => (
        <TreeElement data={child} key={child.id} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  )
}

export default TreeElement;
