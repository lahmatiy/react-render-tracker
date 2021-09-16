import { TransferObjectDiff } from "../../types";
import { isPlainObject } from "./isPlainObject";
import { simpleValueSerialization } from "./simpleValueSerialization";

const { hasOwnProperty } = Object.prototype;

export function objectDiff(
  prev: any,
  next: any
): TransferObjectDiff | false | undefined {
  if (isPlainObject(prev) && isPlainObject(next)) {
    const sample = [];
    let keys = 0;
    let diffKeys = 0;

    for (const name in prev) {
      if (hasOwnProperty.call(prev, name)) {
        keys++;
        if (!hasOwnProperty.call(next, name)) {
          diffKeys++ < 3 &&
            sample.push({ name, prev: simpleValueSerialization(prev[name]) });
        } else if (!Object.is(prev[name], next[name])) {
          diffKeys++ < 3 &&
            sample.push({
              name,
              prev: simpleValueSerialization(prev[name]),
              next: simpleValueSerialization(next[name]),
            });
        }
      }
    }

    for (const name in next) {
      if (hasOwnProperty.call(next, name)) {
        if (!hasOwnProperty.call(prev, name)) {
          keys++;
          diffKeys++ < 3 &&
            sample.push({ name, next: simpleValueSerialization(next[name]) });
        }
      }
    }

    return diffKeys > 0 ? { keys, diffKeys, sample } : false;
  }

  return undefined;
}
