import * as React from "react";
import { TransferChangeDiff, ValueTransition } from "../../../types";
import { DiffArray } from "./DiffArray";
import { DiffObject } from "./DiffObject";
import { DiffSimple } from "./DiffSimple";
import { ShallowEqual } from "./ShallowEqual";

export function Diff({
  diff,
  values,
}: {
  diff?: TransferChangeDiff;
  values: ValueTransition;
}) {
  return (
    <>
      {typeof diff === "object" ? (
        "keys" in diff ? (
          <DiffObject diff={diff} />
        ) : (
          <DiffArray diff={diff} values={values} />
        )
      ) : (
        "prev" in values && <DiffSimple values={values} />
      )}
      {diff === false && <ShallowEqual />}
    </>
  );
}
