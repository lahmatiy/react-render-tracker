import {
  CONTEXT_SYMBOL_STRING,
  FORWARD_REF_SYMBOL_STRING,
  FRAGMENT_SYMBOL_STRING,
  LAZY_SYMBOL_STRING,
  MEMO_SYMBOL_STRING,
  PROVIDER_SYMBOL_STRING,
} from "./constants";
import { getDisplayName } from "./getDisplayName";

// function resolveDisplayName(value: any) {
//   return typeof value === "function"
//     ? getDisplayName(value)
//     : getDisplayNameFromJsx(value);
// }

export function getDisplayNameFromJsx(type: any) {
  if (type) {
    switch (typeof type) {
      case "string":
        return type;

      case "function":
        return getDisplayName(type);

      case "symbol":
        if (String(type) === FRAGMENT_SYMBOL_STRING) {
          return "";
        }

      default:
        if (type.$$typeof) {
          switch (String(type.$$typeof)) {
            case FRAGMENT_SYMBOL_STRING:
              return "";

            case MEMO_SYMBOL_STRING:
            //   name = resolveDisplayName(type.type);
            //   break;
            case FORWARD_REF_SYMBOL_STRING:
            //   name = resolveDisplayName(type.render);
            //   break;
            case LAZY_SYMBOL_STRING: // _ctor
              return getDisplayName(type);

            case PROVIDER_SYMBOL_STRING: {
              const resolvedContext = type._context || type.context;
              return `${getDisplayName(resolvedContext, "Context")}.Provider`;
            }

            case CONTEXT_SYMBOL_STRING: {
              const resolvedContext = type._context || type.context;
              return `${getDisplayName(resolvedContext, "Context")}.Provider`;
            }

            default:
              return String(type.$$typeof);
          }
        }
    }
  }

  return "Unknown";
}
