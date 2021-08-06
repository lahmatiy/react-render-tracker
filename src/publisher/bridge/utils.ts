import { ElementType } from "../types";
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
} from "../constants";

export function utfDecodeString(array: Array<number>): string {
  return String.fromCodePoint(...array);
}

export function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null];
  }

  let parsedDisplayName = displayName;
  let hocDisplayNames = null;

  switch (type) {
    case ElementTypeClass:
    case ElementTypeForwardRef:
    case ElementTypeFunction:
    case ElementTypeMemo:
      if (parsedDisplayName.indexOf("(") >= 0) {
        const matches = parsedDisplayName.match(/[^()]+/g);
        if (matches != null) {
          parsedDisplayName = matches.pop()!;
          hocDisplayNames = matches;
        }
      }
      break;
    default:
      break;
  }

  if (type === ElementTypeMemo) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ["Memo"];
    } else {
      hocDisplayNames.unshift("Memo");
    }
  } else if (type === ElementTypeForwardRef) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ["ForwardRef"];
    } else {
      hocDisplayNames.unshift("ForwardRef");
    }
  }

  return [parsedDisplayName, hocDisplayNames];
}
