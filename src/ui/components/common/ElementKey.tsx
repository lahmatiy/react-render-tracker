import * as React from "react";

const MAX_TEXT = 12;

interface ElementKeyProps {
  value: string | number;
}

const ElementKey = ({ value }: ElementKeyProps) => {
  value = String(value);

  return (
    <span className="element-key" title={value}>
      {value.length > MAX_TEXT ? value.substr(0, MAX_TEXT) + "…" : value}
    </span>
  );
};

export default ElementKey;
