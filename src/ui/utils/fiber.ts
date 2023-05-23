import { FiberType } from "common-types";
import {
  ElementTypeHostComponent,
  ElementTypeHostPortal,
  ElementTypeHostText,
} from "../../common/constants";

export function isHostType(type: FiberType) {
  return (
    type === ElementTypeHostComponent ||
    type === ElementTypeHostText ||
    type === ElementTypeHostPortal
  );
}
