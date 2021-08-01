import React from "react";

interface IButtonToggle {
  icon: JSX.Element;
  isActive: boolean;
  onChange: (fn: (state: boolean) => boolean) => void;
  tooltip: string;
}

const ButtonToggle = ({ icon, isActive, onChange, tooltip }: IButtonToggle) => {
  const handleClick = () => {
    onChange((prev: boolean) => !prev);
  };

  return (
    <button
      className={`icon-toggle ${isActive ? "active" : ""}`}
      onClick={handleClick}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

export default ButtonToggle;
