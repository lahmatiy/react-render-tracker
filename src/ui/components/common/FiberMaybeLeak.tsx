import * as React from "react";
import { TrackingObjectTypeName } from "../../../common/constants";
import { TrackingObjectType } from "common-types";

interface FiberMaybeLeakProps {
  leaked: number;
}

const nothingLeaked: string[] = [];
function listOfLeaks(leaked: number) {
  if (leaked === 0) {
    return nothingLeaked;
  }

  const result = [];
  let bitNum = 0;

  while (leaked >= 1 << bitNum) {
    if (leaked | (1 << bitNum)) {
      const title = TrackingObjectTypeName[bitNum as TrackingObjectType];
      result.push(`${title} (${title[0].toUpperCase()})`);
    }
    bitNum++;
  }

  return result;
}

function formatListOfLeaks(leaks: string[]) {
  return "\n- " + leaks.join("\n- ");
}

function codesOfLeaks(leaks: string[]) {
  return leaks.map(leak => leak[0]);
}

export default function FiberMaybeLeak({ leaked }: FiberMaybeLeakProps) {
  if (!leaked) {
    return null;
  }

  const leaks = listOfLeaks(leaked);

  return (
    <span
      className="fiber-maybe-leak"
      title={`A component is considered as a source of potential memory leak.\nThe following objects from the unmounted component are still being referenced and not garbage collected: ${formatListOfLeaks(
        leaks
      )}`}
    >
      Maybe mem leak ({codesOfLeaks(leaks)})
    </span>
  );
}
