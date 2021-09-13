import { FiberType } from "../../types";
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
} from "./constants";

export function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: FiberType
): { displayName: string | null; hocDisplayNames: string[] | null } {
  if (displayName === null) {
    return { displayName, hocDisplayNames: null };
  }

  let hocDisplayNames: string[] = [];

  if (
    type === ElementTypeClass ||
    type === ElementTypeFunction ||
    type === ElementTypeForwardRef ||
    type === ElementTypeMemo
  ) {
    if (displayName.includes("(")) {
      const matches = displayName.match(/[^()]+/g);

      if (matches !== null) {
        displayName = matches.pop() || "";
        hocDisplayNames = matches;
      }
    }
  }

  if (type === ElementTypeMemo) {
    hocDisplayNames.unshift("Memo");
  } else if (type === ElementTypeForwardRef) {
    hocDisplayNames.unshift("ForwardRef");
  }

  return {
    displayName,
    hocDisplayNames: hocDisplayNames.length > 0 ? hocDisplayNames : null,
  };
}
