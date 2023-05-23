import * as React from "react";

interface ButtonToggleProps {
  icon: JSX.Element;
  isActive?: boolean;
  isDisabled?: boolean;
  onChange: (fn: (state: boolean) => boolean) => void;
  tooltip: string;
  className?: string;
}

const ButtonToggle = ({
  icon,
  isActive = false,
  isDisabled = false,
  onChange,
  tooltip,
  className,
}: ButtonToggleProps) => {
  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange((prev: boolean) => !prev);
    },
    [onChange]
  );

  return (
    <button
      className={`button-toggle${isActive ? " active" : ""}${
        className ? " " + className : ""
      }`}
      disabled={isDisabled}
      onClick={handleClick}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

export default ButtonToggle;
