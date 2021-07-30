import React from "react";

import ChevronDown from "react-feather/dist/icons/chevron-down";

const ButtonCollapse = ({ isCollapsed, onToggle }) => {
  return (
    <button
      className={`tree-element__toggle ${isCollapsed ? "open" : ""}`}
      onClick={onToggle} >
      <ChevronDown />
    </button>
  );
};

export default ButtonCollapse;
