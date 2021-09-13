import * as React from "react";
import { MessageFiber } from "../../types";

const MAX_TEXT = 12;

interface FiberKeyProps {
  fiber: MessageFiber;
}

const FiberKey = ({ fiber: { displayName, key } }: FiberKeyProps) => {
  const value = String(key);

  return (
    <span className="fiber-key" title={`<${displayName} key="${value}">`}>
      {value.length > MAX_TEXT ? value.substr(0, MAX_TEXT) + "…" : value}
    </span>
  );
};

export default FiberKey;
