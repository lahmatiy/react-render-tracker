import React from "react";
import ChevronDown from "react-feather/dist/icons/chevron-down";

interface ButtonCollapseProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ButtonCollapse = ({ isCollapsed, onToggle }: ButtonCollapseProps) => {
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
