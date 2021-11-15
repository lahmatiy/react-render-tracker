import * as React from "react";
import {
  FiberTypeHook,
  MessageFiber,
  TransferMemoChange,
  TransferDepChange,
} from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import { ResolveSourceLoc } from "../../common/SourceLoc";
import { CallTracePath } from "../CallStack";
import { EventChangesSummary } from "../EventChangesSummary";
import { ChangesMatrix } from "./ChangesMatrix";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionMemoHooks({ fiber }: { fiber: MessageFiber }) {
  const { events = [] } = useFiber(fiber.id) || {};
  const memoHooks = new Map<
    number,
    {
      hook: FiberTypeHook;
      deps: number | null;
      updates: Array<{
        num: number;
        main: JSX.Element;
        values: [TransferMemoChange, ...Array<TransferDepChange | null>] | null;
      }>;
      computeCount: 0;
      headers: string[];
    }
  >();

  for (const hook of fiber.typeDef.hooks) {
    if (hook.name === "useMemo" || hook.name === "useCallback") {
      memoHooks.set(hook.index, {
        hook,
        deps: hook.deps,
        updates: [],
        computeCount: 0,
        headers:
          hook.deps === null
            ? ["[value]"]
            : ["[value]"].concat(
                Array.from({ length: hook.deps }, (_, index) => "dep " + index)
              ),
      });
    }
  }

  if (memoHooks.size === 0) {
    return null;
  }

  for (const { event, changes } of events) {
    if (event.op !== "update") {
      continue;
    }

    for (const hookChanges of memoHooks.values()) {
      hookChanges.updates.push({
        num: hookChanges.updates.length + 1,
        main: (
          <>
            {hookChanges.updates.length + 1}.{" "}
            <EventChangesSummary changes={changes} />
          </>
        ),
        values: null,
      });
    }

    if (changes?.memos) {
      for (const memoChange of changes?.memos) {
        const hookUpdates = memoHooks.get(memoChange.hook);

        if (hookUpdates === undefined) {
          console.warn("[react-render-tracker] Update for unknown memo");
          continue;
        }

        const lastUpdate = hookUpdates.updates[hookUpdates.updates.length - 1];

        hookUpdates.computeCount++;
        lastUpdate.values =
          hookUpdates.deps !== null
            ? [
                memoChange,
                ...Array.from({ length: hookUpdates.deps }, () => null),
              ]
            : [memoChange];

        if (
          hookUpdates.deps !== null &&
          Array.isArray(memoChange.deps) &&
          Array.isArray(lastUpdate.values)
        ) {
          for (const dep of memoChange.deps) {
            lastUpdate.values[dep.index + 1] = dep;
          }
        }
      }
    }
  }

  return (
    <FiberInfoSection id="memo-hooks" header={`Memo hooks (${memoHooks.size})`}>
      <ol className="fiber-info-section-memo-content">
        {[...memoHooks.values()].map(
          ({ hook, updates, computeCount, headers }) => {
            return (
              <li key={hook.index}>
                <CallTracePath
                  key={hook.index}
                  expanded
                  path={hook.trace.path}
                />
                <ResolveSourceLoc loc={hook.trace.loc}>
                  {hook.name}(…)
                </ResolveSourceLoc>{" "}
                <span className="fiber-info-section-memo-content__recompute-stat">
                  {computeCount === 0
                    ? "Never recompute"
                    : computeCount === updates.length
                    ? "Every update recompute"
                    : `${computeCount} of ${updates.length} updates recompute`}
                </span>
                {updates.some(update => update.values !== null) && (
                  <ChangesMatrix
                    mainHeader="Update"
                    headers={headers}
                    data={updates}
                  />
                )}
              </li>
            );
          }
        )}
      </ol>
    </FiberInfoSection>
  );
}
