import * as React from "react";

interface ButtonToggleProps {
  icon: JSX.Element;
  isActive: boolean;
  onChange: (fn: (state: boolean) => boolean) => void;
  tooltip: string;
  className?: string;
}

const ButtonToggle = ({
  icon,
  isActive,
  onChange,
  tooltip,
  className,
}: ButtonToggleProps) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange((prev: boolean) => !prev);
  };

  return (
    <button
      className={`button-toggle${isActive ? " active" : ""}${
        className ? " " + className : ""
      }`}
      onClick={handleClick}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

export default ButtonToggle;
