import React from "react";

type CardProps = {
  children: JSX.Element | string | (JSX.Element | string)[];
};

const Card = ({ children }: CardProps) => {
  return <div className="card">{children}</div>;
};

export default Card;
