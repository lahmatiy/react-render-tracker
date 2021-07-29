import React from "react";

const ButtonToggle = ({ Icon, isActive, onChange, tooltip }) => {
  const handleClick = () => {
    onChange(prev => !prev);
  }

  return (
    <button className={`icon-toggle ${isActive ? "active" : ""}`} onClick={handleClick} title={tooltip}>
      <Icon />
    </button>
  );
};

export default ButtonToggle;
