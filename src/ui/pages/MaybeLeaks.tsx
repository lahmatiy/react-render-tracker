import * as React from "react";
import { useSelectedId } from "../utils/selection";
import { useFiberMaps, useLeakedFibers } from "../utils/fiber-maps";
import TreeLeafCaption from "../components/fiber-tree/TreeLeafCaption";
import { MessageFiber } from "../types";
import ButtonExpand from "../components/fiber-tree/ButtonExpand";

function MaybeLeaksPageBadge() {
  const leakedFibers = useLeakedFibers();
  return <>{leakedFibers.length || ""}</>;
}

function MaybeLeaksPage() {
  const { selectedId } = useSelectedId();
  const leakedFibers = useLeakedFibers();
  const { fiberById } = useFiberMaps();
  let content: JSX.Element | JSX.Element[] | null = null;

  if (!leakedFibers.length) {
    content = <div className="no-leaks">No leaks detected</div>;
  } else {
    const types = new Map<number, MessageFiber[]>();
    const typeNames = new Set();

    for (const fiberId of leakedFibers) {
      const fiber = fiberById.get(fiberId);

      if (!fiber) {
        continue;
      }

      const fibers = types.get(fiber.typeId);

      if (!fibers) {
        types.set(fiber.typeId, [fiber]);
        typeNames.add(fiber.displayName);
      } else {
        fibers.push(fiber);
      }
    }

    content = [...types.values()]
      .sort((a, b) => (a[0].displayName < b[0].displayName ? -1 : 1))
      .map(fibers => (
        <FiberGroup
          key={fibers[0].typeId}
          fibers={fibers}
          initExpanded={true}
        />
      ));
  }

  return (
    <div
      className="app-page app-page-maybe-leaks"
      data-has-selected={selectedId !== null || undefined}
    >
      {content}
    </div>
  );
}

function FiberGroup({
  fibers,
  initExpanded = false,
}: {
  fibers: MessageFiber[];
  initExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initExpanded);

  return (
    <>
      <div className="maybe-leaks__type-header">
        <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
        {fibers[0].displayName}
        <span className="maybe-leaks__type-header-count">{fibers.length}</span>
      </div>

      {expanded && (
        <div className="maybe-leaks__type-fibers">
          {fibers.map(fiber => (
            <React.Fragment key={fiber.id}>
              <TreeLeafCaption fiber={fiber}></TreeLeafCaption>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}

const MaybeLeaksPageBadgeMemo = React.memo(MaybeLeaksPageBadge);
MaybeLeaksPageBadgeMemo.displayName = "MaybeLeaksPageBadge";

const MaybeLeaksPageMemo = React.memo(MaybeLeaksPage);
MaybeLeaksPageMemo.displayName = "MaybeLeaksPage";

export {
  MaybeLeaksPageMemo as MaybeLeaksPage,
  MaybeLeaksPageBadgeMemo as MaybeLeaksPageBadge,
};
