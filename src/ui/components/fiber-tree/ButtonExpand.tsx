import * as React from "react";

interface ButtonExpandProps {
  expanded: boolean;
  setExpanded?: (value: boolean) => void;
}

const ButtonExpand = ({ expanded, setExpanded }: ButtonExpandProps) => {
  const collapsedCls = expanded ? "expanded" : "";
  const disabledCls = setExpanded ? "" : "disabled";
  const handleClick =
    setExpanded &&
    ((event: React.MouseEvent) => {
      event.stopPropagation();
      setExpanded(!expanded);
    });

  return (
    <button
      className={`button-expand ${collapsedCls} ${disabledCls}`}
      tabIndex={-1}
      onClick={handleClick}
    />
  );
};

export default ButtonExpand;
