import { getDisplayNameFromJsx } from "./getDisplayNameFromJsx";

const { hasOwnProperty } = Object.prototype;

function isPlainObject(value: any) {
  return (
    typeof value === "object" && value !== null && value.constructor === Object
  );
}

export function simpleValueSerialization(value: any) {
  switch (typeof value) {
    case "boolean":
    case "undefined":
    case "number":
    case "bigint":
    case "symbol":
      return String(value);

    case "function":
      return "ƒn";

    case "string":
      return JSON.stringify(
        value.length > 20 ? value.slice(0, 20) + "…" : value
      );

    case "object":
      if (value === null) {
        return "null";
      }

      if (Array.isArray(value)) {
        return value.length ? "[…]" : "[]";
      }

      if (
        typeof value.$$typeof === "symbol" &&
        String(value.$$typeof) === "Symbol(react.element)"
      ) {
        const name = getDisplayNameFromJsx(value.type);

        return `<${name}${Object.keys(value.props).length > 0 ? " …" : ""}/>`;
      }

      if (isPlainObject(value)) {
        for (const key in value) {
          if (hasOwnProperty.call(value, key)) {
            return "{…}";
          }
        }

        return "{}";
      }

      return Object.prototype.toString.call(value);
  }
}
