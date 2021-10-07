import * as React from "react";
import { MessageFiber } from "../../types";
import { useFiber, useFiberMaps } from "../../utils/fiber-maps";
import { usePinnedContext } from "../../utils/pinned";
import FiberId from "../common/FiberId";
import TreeLeafCaption from "./TreeLeafCaption";

function FiberLink({
  id,
  name,
  pin,
}: {
  id: number;
  name: string | null;
  pin: (id: number) => void;
}) {
  return (
    <span className="fiber-tree-header-fiber-link">
      <span
        className="fiber-tree-header-fiber-link__name"
        onClick={() => pin(id)}
      >
        {name || "Unknown"}
      </span>
      <FiberId id={id} />
    </span>
  );
}

function FiberPath({
  fiber,
  groupByParent,
}: {
  fiber: MessageFiber;
  groupByParent: boolean;
}) {
  const { fiberById } = useFiberMaps();
  const { pin } = usePinnedContext();

  const path = [];
  let cursor = fiber[groupByParent ? "parentId" : "ownerId"];
  while (cursor !== 0) {
    const ancestor = fiberById.get(cursor);

    path.unshift(
      <FiberLink
        key={cursor}
        id={cursor}
        name={ancestor?.displayName || "Unknown"}
        pin={pin}
      />
    );

    cursor = ancestor?.[groupByParent ? "parentId" : "ownerId"] || 0;
  }

  if (path.length === 0) {
    return null;
  }

  return <div className="fiber-tree-header__path">{path}</div>;
}

const FiberTreeHeader = React.memo(
  ({
    rootId,
    groupByParent,
    showTimings,
  }: {
    rootId: number;
    groupByParent: boolean;
    showTimings: boolean;
  }) => {
    const fiber = useFiber(rootId);

    if (rootId === 0 || !fiber) {
      return null;
    }

    return (
      <div className="fiber-tree-header">
        <FiberPath fiber={fiber} groupByParent={groupByParent} />
        <TreeLeafCaption
          key={rootId}
          fiber={fiber}
          pinned={true}
          showTimings={showTimings}
        />
      </div>
    );
  }
);

FiberTreeHeader.displayName = "FiberTreeHeader";

export default FiberTreeHeader;
