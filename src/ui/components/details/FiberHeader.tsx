import * as React from "react";
import { FiberTypeName } from "../../../common/constants";
import { MessageFiber } from "../../types";
import { useFiberMaps } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import { ChevronUp, ChevronDown, Pin } from "../common/icons";
import { useSelectedId } from "../../utils/selection";
import { useTreeUpdateSubscription } from "../../utils/tree";
import { usePinnedId } from "../../utils/pinned";
import { FiberLink } from "./FiberLink";
import { SourceLoc } from "../common/SourceLoc";
import FiberMaybeLeak from "../common/FiberMaybeLeak";

const FiberInfoHeaderPrelude = ({
  fiber,
  groupByParent,
  showUnmounted,
}: {
  fiber: MessageFiber;
  groupByParent: boolean;
  showUnmounted: boolean;
}) => {
  const { pinnedId, pin } = usePinnedId();
  const pinned = fiber.id === pinnedId;

  return (
    <div className="fiber-info-header-prelude">
      <div className="fiber-info-header-prelude__content">
        <span className="fiber-info-header-type-badge" data-type="type">
          {FiberTypeName[fiber.type]}
        </span>
        {!fiber.mounted && (
          <span className="fiber-info-header-type-badge">Unmounted</span>
        )}
        {fiber.leaked ? <FiberMaybeLeak leaked={fiber.leaked} /> : null}
      </div>
      <span className="fiber-info-header-prelude__buttons">
        <InstanceSwitcher
          fiberId={fiber.id}
          typeId={fiber.typeId}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
        />
        <button
          className={
            "fiber-info-header-prelude__button" + (pinned ? " selected" : "")
          }
          onClick={() => {
            pin(!pinned ? fiber.id : 0);
          }}
          title={pinned ? "Unpin" : "Pin"}
        >
          {Pin}
        </button>
      </span>
    </div>
  );
};

function InstanceSwitcher({
  fiberId,
  typeId,
  groupByParent,
  showUnmounted,
}: {
  fiberId: number;
  typeId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}) {
  const { selectedId, select } = useSelectedId();
  const { pinnedId } = usePinnedId();
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const treeRoot = tree.getOrCreate(pinnedId);
  const selectedNode =
    selectedId !== null ? tree.get(selectedId) || null : null;
  const treeUpdate = useTreeUpdateSubscription(tree);

  const { index, total } = React.useMemo(() => {
    let index = 0;
    let total = 0;

    treeRoot.walk(node => {
      if (node.fiber?.typeId === typeId) {
        total++;

        if (fiberId === node.id) {
          index = total;
        }
      }
    });

    return { index, total };
  }, [tree, treeUpdate, treeRoot, fiberId]);

  const disableButtons = total === 0 || (total === 1 && index === 1);

  return (
    <div className="fiber-info-instance-iterator">
      <span className="fiber-info-instance-iterator__label">
        {index || "–"} / {total}
      </span>
      <span className="fiber-info-header-prelude__buttons">
        <button
          className="fiber-info-header-prelude__button"
          disabled={disableButtons}
          onClick={() => {
            const startNode =
              treeRoot === tree.root
                ? selectedNode
                : selectedNode !== null && treeRoot.contains(selectedNode)
                ? selectedNode
                : null;
            const node = treeRoot.findBack(
              node => node.id !== fiberId && node.fiber?.typeId === typeId,
              startNode
            );

            if (node !== null) {
              select(node.id);
            }
          }}
        >
          {ChevronUp}
        </button>
        <button
          className="fiber-info-header-prelude__button"
          disabled={disableButtons}
          onClick={() => {
            const startNode =
              treeRoot === tree.root
                ? selectedNode
                : selectedNode !== null && treeRoot.contains(selectedNode)
                ? selectedNode
                : null;
            const node = treeRoot.find(
              node => node.id !== fiberId && node.fiber?.typeId === typeId,
              startNode
            );

            if (node !== null) {
              select(node.id);
            }
          }}
        >
          {ChevronDown}
        </button>
      </span>
    </div>
  );
}

function FiberInfoHeaderNotes({ fiber }: { fiber?: MessageFiber }) {
  const { fiberById } = useFiberMaps();
  const owner = fiberById.get(fiber?.ownerId as number);
  const parent = fiberById.get(fiber?.parentId as number);

  if (!fiber || !parent) {
    return null;
  }

  return (
    <div className="fiber-info-header-notes">
      {parent === owner ? (
        <>
          Child of &amp; created by{" "}
          <FiberLink key={parent.id} id={parent.id} name={parent.displayName} />
        </>
      ) : (
        <>
          {"Child of "}
          <FiberLink key={parent.id} id={parent.id} name={parent.displayName} />
          {", "}
          {owner ? (
            <>
              {"created by "}
              <FiberLink
                key={owner.id}
                id={owner.id}
                name={owner.displayName}
              />
            </>
          ) : (
            "no owner (created outside of render)"
          )}
        </>
      )}
    </div>
  );
}

export const FiberInfoHeader = ({
  fiber,
  groupByParent,
  showUnmounted,
}: {
  fiber: MessageFiber;
  groupByParent: boolean;
  showUnmounted: boolean;
}) => {
  return (
    <>
      <FiberInfoHeaderPrelude
        fiber={fiber}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
      />
      <div className="fiber-info-header-content">
        {fiber.displayName}
        <FiberId id={fiber.id} />
        {fiber.loc && (
          <SourceLoc type="jsx" loc={fiber.loc}>
            &lt;jsx&gt;
          </SourceLoc>
        )}
      </div>
      <FiberInfoHeaderNotes fiber={fiber} />
    </>
  );
};
