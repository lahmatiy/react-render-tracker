import * as React from "react";
import { MessageFiber, TransferDepChange } from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import SourceLoc from "../../common/SourceLoc";
import { CallTracePath } from "../CallStack";
import { Diff } from "../diff/Diff";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionMemo({ fiber }: { fiber: MessageFiber }) {
  const { events = [] } = useFiber(fiber.id) || {};
  const memoHooks = fiber.typeDef.hooks.filter(
    hook => hook.name === "useMemo" || hook.name === "useCallback"
  );

  if (memoHooks.length === 0) {
    return null;
  }

  const computes = new Map<
    number,
    { count: number; deps: Array<(TransferDepChange | null)[]> | null }
  >();
  let updatesCount = 0;

  for (const { event } of events) {
    if (event.op === "update") {
      updatesCount++;

      if (event.changes?.memos) {
        for (const { hook, deps } of event.changes?.memos) {
          const depsCount = fiber.typeDef.hooks[hook].deps;
          let compute = computes.get(hook);

          if (compute === undefined) {
            computes.set(
              hook,
              (compute = {
                count: 0,
                deps:
                  depsCount !== null
                    ? Array.from({ length: depsCount }, () => [])
                    : null,
              })
            );
          }

          compute.count++;

          if (
            depsCount !== null &&
            Array.isArray(deps) &&
            Array.isArray(compute.deps)
          ) {
            for (const dep of deps) {
              compute.deps[dep.index].push(dep);
            }
            for (let i = 0; i < depsCount; i++) {
              if (compute.deps[i].length < compute.count) {
                compute.deps[i].push(null);
              }
            }
          }
        }
      }
    }
  }

  return (
    <FiberInfoSection header="Memoization">
      {memoHooks.map(hook => {
        const compute = computes.get(hook.index);

        return (
          <div key={hook.index}>
            <CallTracePath key={hook.index} expanded path={hook.trace.path} />
            <SourceLoc loc={hook.trace.loc}>{hook.name}(…)</SourceLoc>{" "}
            {compute ? compute.count : 0}/{updatesCount}
            {compute?.deps &&
              compute.deps.map((dep, index) => (
                <div key={index} style={{ marginLeft: "20px" }}>
                  {" dep#" + index + " "}
                  {dep.reduce(
                    (count, change) => count + (change !== null ? 1 : 0),
                    0
                  )}
                  /{updatesCount}
                  {dep.map((change, idx) => (
                    <div key={idx} style={{ marginLeft: "20px" }}>
                      {change === null ? (
                        "–"
                      ) : (
                        <Diff diff={change.diff} values={change} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        );
      })}
    </FiberInfoSection>
  );
}
