import * as React from "react";
import { FiberTypeHook, MessageFiber } from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import { FiberInfoSection } from "./FiberInfoSection";
import { ResolveSourceLoc } from "../../common/SourceLoc";
import { TransferCallTracePoint } from "common-types";

export function FiberInfoSectionHooks({ fiber }: { fiber: MessageFiber }) {
  const { typeDef } = useFiber(fiber.id) || {};
  const hooks = typeDef?.hooks || [];
  const hookMap = React.useMemo(() => {
    const map = new Map<string, number>();

    for (const hook of hooks) {
      map.set(hook.name, (map.get(hook.name) || 0) + 1);
    }

    return map;
  }, [hooks]);
  const [selectedHook, selectHook] = React.useState<string | null>(
    hookMap.size === 1 ? hooks[0]?.name || null : null
  );
  const filteredHooks = React.useMemo(
    () =>
      selectedHook === null
        ? hooks
        : hooks.filter(hook => hook.name === selectedHook),
    [hooks, selectedHook]
  );

  if (!typeDef?.hooks?.length) {
    return null;
  }

  return (
    <FiberInfoSection id="hooks" header={`Hooks (${typeDef.hooks.length})`}>
      {hookMap.size > 1 && (
        <HooksMap
          hooks={typeDef.hooks}
          hookMap={hookMap}
          selectedHook={selectedHook}
          selectHook={selectHook}
        />
      )}
      <div className="fiber-info-section-hooks-content">
        <HookGrouper hooks={filteredHooks} traceDepth={0} />
      </div>
    </FiberInfoSection>
  );
}

const HooksMap = React.memo(
  ({
    hooks,
    hookMap,
    selectedHook,
    selectHook,
  }: {
    hooks: FiberTypeHook[];
    hookMap: Map<string, number>;
    selectedHook: string | null;
    selectHook(hook: string | null): void;
  }) => (
    <div className="fiber-info-section-hooks-map">
      {hookMap.size > 1 && (
        <HooksMapButton
          key="All"
          name="All"
          count={hooks.length}
          selected={selectedHook === null}
          select={() => selectHook(null)}
        />
      )}
      {[...hookMap]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([name, count]) => (
          <HooksMapButton
            key={name}
            name={name}
            count={count}
            selected={selectedHook === name}
            select={() => selectHook(name)}
          />
        ))}
    </div>
  )
);
HooksMap.displayName = "HooksMap";

function HooksMapButton({
  name,
  count,
  selected,
  select,
}: {
  name: string;
  count: number;
  selected: boolean;
  select(): void;
}) {
  return (
    <div
      className={`fiber-info-section-hooks-map-button${
        selected ? " selected" : ""
      }`}
      onClick={select}
    >
      {name}
      <span className="count">{count}</span>
    </div>
  );
}

function HookGrouper({
  hooks,
  traceDepth,
}: {
  hooks: FiberTypeHook[];
  traceDepth: number;
}) {
  const list: React.ReactNode[] = [];
  const flushBuffer = () => {
    if (prev === undefined) {
      return;
    }

    if (prev === null) {
      list.push(...buffer.map(hook => <Hook key={hook.index} hook={hook} />));
    } else {
      list.push(
        <CustomHook
          key={"custom" + list.length}
          tracePoint={prev}
          hooks={buffer}
          traceDepth={traceDepth}
        />
      );
    }

    buffer = [];
    prev = undefined;
  };
  let buffer: FiberTypeHook[] = [];
  let prev: TransferCallTracePoint | null | undefined = undefined;

  for (const hook of hooks) {
    const current = hook.trace.path?.[traceDepth] || null;

    if (
      prev !== undefined &&
      (current?.name !== prev?.name || current?.loc !== prev?.loc)
    ) {
      flushBuffer();
    }

    buffer.push(hook);
    prev = current;
  }

  flushBuffer();

  return list;
}

function CustomHook({
  tracePoint,
  hooks,
  traceDepth,
}: {
  tracePoint: TransferCallTracePoint;
  hooks: FiberTypeHook[];
  traceDepth: number;
}) {
  return (
    <div className="fiber-info-section-hooks-leaf">
      <div className="fiber-info-section-hooks-leaf__custom-hook">
        <ResolveSourceLoc loc={tracePoint.loc}>
          {tracePoint.name}()
        </ResolveSourceLoc>
      </div>
      <div className="fiber-info-section-hooks-leaf__children">
        <HookGrouper hooks={hooks} traceDepth={traceDepth + 1} />
      </div>
    </div>
  );
}

function Hook({ hook }: { hook: FiberTypeHook }) {
  return (
    <div className="fiber-info-section-hooks-leaf">
      <ResolveSourceLoc loc={hook.trace.loc}>{hook.name}()</ResolveSourceLoc>
      <span className="fiber-info-section-hooks-leaf__hook-index">
        #{hook.index}
      </span>
      {hook.context && (
        <span className="fiber-info-section-hooks-leaf__context">
          {hook.context.name}
          {hook.context.providerId}
        </span>
      )}
    </div>
  );
}
