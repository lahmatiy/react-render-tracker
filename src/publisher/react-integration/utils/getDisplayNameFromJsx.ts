import {
  FORWARD_REF_SYMBOL_STRING,
  FRAGMENT_SYMBOL_STRING,
  LAZY_SYMBOL_STRING,
  MEMO_SYMBOL_STRING,
} from "./constants";
import { getDisplayName } from "./getDisplayName";

function resolveDisplayName(value: any) {
  return typeof value === "function"
    ? getDisplayName(value)
    : getDisplayNameFromJsx(value);
}

export function getDisplayNameFromJsx(type: any) {
  let name = "";

  if (type) {
    switch (typeof type) {
      case "string":
        name = type;
        break;

      case "function":
        name = getDisplayName(type);
        break;

      default:
        switch (String(type.$$typeof)) {
          case FRAGMENT_SYMBOL_STRING:
            name = "";
            break;
          case MEMO_SYMBOL_STRING:
            name = resolveDisplayName(type.type);
            break;
          case FORWARD_REF_SYMBOL_STRING:
            name = resolveDisplayName(type.render);
            break;
          case LAZY_SYMBOL_STRING:
            name = getDisplayName(type._ctor);
            break;
          default:
            name = "String(type.$$typeof)";
        }
    }
  }

  return name;
}
