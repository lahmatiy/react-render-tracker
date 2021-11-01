import * as React from "react";
import {
  FiberTypeHook,
  MessageFiber,
  TransferMemoChange,
  TransferDepChange,
  TransferChangeDiff,
  FiberChanges,
} from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import SourceLoc from "../../common/SourceLoc";
import { CallTracePath } from "../CallStack";
import { Diff } from "../diff/Diff";
import { EventChangesSummary } from "../EventChangesSummary";
import { FiberInfoSection } from "./FiberInfoSection";

type UpdateChangesRow = {
  num: number;
  changes: FiberChanges | null;
  values: Array<null | {
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
  }> | null;
};

function UpdateChangesMatrixRow({
  headers,
  data,
}: {
  headers: string[];
  data: UpdateChangesRow;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <tr
        className="update-deps-table__row"
        onClick={() => setExpanded(expanded => !expanded)}
      >
        <td>
          {data.num}. <EventChangesSummary changes={data.changes} />
        </td>
        {data.values?.map((value, index) => (
          <td
            key={index}
            className={
              value !== null
                ? value.diff === false
                  ? "shallow-equal"
                  : "has-diff"
                : "no-diff"
            }
          />
        ))}
        <td />
      </tr>
      {expanded && (
        <tr className="update-deps-table__row-details">
          <td colSpan={(data.values?.length || 0) + 2}>
            {data.values?.map((change, idx) =>
              change === null ? null : (
                <div key={idx}>
                  {headers[idx]} <Diff diff={change.diff} values={change} />
                </div>
              )
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function UpdateChangesMatrix({
  headers,
  data,
}: {
  headers: string[];
  data: UpdateChangesRow[];
}) {
  return (
    <table className="update-deps-table">
      <thead>
        <tr>
          <th>
            <div>
              <span>update</span>
            </div>
          </th>
          {headers.map((header, index) => (
            <th key={index}>
              <div>
                <span>{header}</span>
              </div>
            </th>
          ))}
          <th style={{ width: "100%" }} />
        </tr>
      </thead>
      <tbody>
        {data.map(entry => (
          <UpdateChangesMatrixRow
            key={entry.num}
            headers={headers}
            data={entry}
          />
        ))}
      </tbody>
    </table>
  );
}

export function FiberInfoSectionMemo({ fiber }: { fiber: MessageFiber }) {
  const { events = [] } = useFiber(fiber.id) || {};
  const memoHooks = new Map<
    number,
    {
      hook: FiberTypeHook;
      deps: number | null;
      updates: Array<{
        num: number;
        changes: FiberChanges | null;
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
                Array.from({ length: hook.deps }, (_, index) => "dep#" + index)
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
        changes,
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
            const rows = updates.filter(update => update.values !== null);

            return (
              <li key={hook.index}>
                <CallTracePath
                  key={hook.index}
                  expanded
                  path={hook.trace.path}
                />
                <SourceLoc loc={hook.trace.loc}>{hook.name}(…)</SourceLoc>{" "}
                <span className="fiber-info-section-memo-content__recompute-stat">
                  {computeCount === 0
                    ? "Never recompute"
                    : computeCount === updates.length
                    ? "Recompute on each update"
                    : `Recompute ${computeCount} times of ${updates.length} updates`}
                </span>
                {rows.length > 0 && (
                  <UpdateChangesMatrix headers={headers} data={rows} />
                )}
              </li>
            );
          }
        )}
      </ol>
    </FiberInfoSection>
  );
}
