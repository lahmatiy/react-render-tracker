import { TransferArrayDiff } from "../../types";

export function arrayDiff(
  prev: any,
  next: any
): TransferArrayDiff | false | undefined {
  if (Array.isArray(prev) && Array.isArray(next)) {
    let eqLeft = 0;
    let eqRight = 0;

    for (let i = 0; i < prev.length; i++, eqLeft++) {
      if (!Object.is(prev[i], next[i])) {
        break;
      }
    }

    for (let i = prev.length - 1; i > eqLeft; i--, eqRight++) {
      if (!Object.is(prev[i], next[i])) {
        break;
      }
    }

    return prev.length !== next.length || eqLeft !== prev.length
      ? { prevLength: prev.length, nextLength: next.length, eqLeft, eqRight }
      : false;
  }

  return undefined;
}
