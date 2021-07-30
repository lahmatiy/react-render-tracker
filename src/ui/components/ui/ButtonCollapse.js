import React from "react";

import ChevronDown from "react-feather/dist/icons/chevron-down";

const ButtonCollapse = ({ isCollapsed, onToggle }) => {
  const collapsedCls = isCollapsed ? "open" : "";
  const disabledCls = typeof onToggle === "function" ? "" : "disabled";

  return (
    <button
      className={`tree-element__toggle ${collapsedCls} ${disabledCls}`}
      onClick={onToggle}
    >
      <ChevronDown />
    </button>
  );
};

export default ButtonCollapse;
