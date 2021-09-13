import * as React from "react";

interface FiberIdProps {
  id: number;
}

const FiberId = ({ id }: FiberIdProps) => {
  return <span className="fiber-id">#{id}</span>;
};

export default FiberId;
