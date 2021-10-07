import * as React from "react";
import { MessageFiber } from "../../types";
import { useFiberMaps, useProviderCustomers } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import { ChevronUp, ChevronDown } from "../common/icons";
import { ElementTypeProvider, fiberTypeName } from "../../../common/constants";
import { useSelectedId } from "../../utils/selection";
import { CallStackList } from "./CallStack";
import { FiberLink } from "./FiberLink";
import { useTreeUpdateSubscription } from "../../utils/tree";
import { usePinnedId } from "../../utils/pinned";

interface IFiberInfo {
  fiberId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}

interface IFiberInfoSection {
  header: string;
  emptyText?: string;
  children?: JSX.Element | string | null;
}

function FiberInfoSection({ header, emptyText, children }: IFiberInfoSection) {
  return (
    <div className="fiber-info-section">
      <div className="fiber-info-section__header">
        {header}
        {!children ? (
          <span className="fiber-info-section__header-no-data">
            {emptyText || "no data"}
          </span>
        ) : (
          ""
        )}
      </div>
      {children}
    </div>
  );
}

function FiberContexts({ fiber }: { fiber: MessageFiber }) {
  const { contexts } = fiber;

  if (!Array.isArray(contexts)) {
    return null;
  }

  return (
    <>
      {contexts.map(({ name, providerId, reads }, index) => {
        return (
          <div key={index}>
            {providerId !== undefined ? (
              <FiberLink id={providerId} name={name} />
            ) : (
              <>
                {name}{" "}
                <span className="fiber-info-fiber-context__no-provider">
                  No provider found
                </span>
              </>
            )}
            {reads && (
              <div className="fiber-info-fiber-context__reads">
                <CallStackList
                  expanded
                  compat={false}
                  paths={reads.map(read => read.path)}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function ConsumersSection({ fiber }: { fiber: MessageFiber }) {
  const fibers = useProviderCustomers(fiber.id);

  return (
    <FiberInfoSection header="Consumers">
      <>{fibers.length}</>
    </FiberInfoSection>
  );
}

function MemoizationSection() {
  return <FiberInfoSection header="Memoization">TBD</FiberInfoSection>;
}

function FiberHeaderNotes({ fiber }: { fiber?: MessageFiber }) {
  const { fiberById } = useFiberMaps();
  const owner = fiberById.get(fiber?.ownerId as number);
  const parent = fiberById.get(fiber?.parentId as number);

  if (!fiber || !parent) {
    return null;
  }

  return (
    <div className="fiber-info__header-notes">
      {parent === owner ? (
        <>
          Parent / created by{" "}
          <FiberLink key={parent.id} id={parent.id} name={parent.displayName} />
        </>
      ) : (
        <>
          {"Parent: "}
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
  const { select } = useSelectedId();
  const { pinnedId } = usePinnedId();
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const treeUpdate = useTreeUpdateSubscription(tree);

  const { index, total } = React.useMemo(() => {
    let index = 0;
    let total = 0;

    tree.get(pinnedId)?.walk(node => {
      if (node.fiber?.typeId === typeId) {
        total++;

        if (fiberId === node.id) {
          index = total;
        }
      }
    });

    return { index, total };
  }, [tree, treeUpdate, pinnedId, fiberId]);

  const disableButtons = total === 0 || (total === 1 && index === 1);

  return (
    <div className="fiber-info-instance-iterator">
      <span className="fiber-info-instance-iterator__label">
        {index || "–"} / {total}
      </span>
      <span className="fiber-info-instance-iterator__buttons">
        <button
          className="fiber-info-instance-iterator__button"
          disabled={disableButtons}
          onClick={() => {
            const node = tree.findBack(
              node => node.id !== fiberId && node.fiber?.typeId === typeId,
              fiberId
            );

            if (node !== null) {
              select(node.id);
            }
          }}
        >
          {ChevronUp}
        </button>
        <button
          className="fiber-info-instance-iterator__button"
          disabled={disableButtons}
          onClick={() => {
            const node = tree.find(
              node => node.id !== fiberId && node.fiber?.typeId === typeId,
              fiberId
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

const FiberInfo = ({ fiberId, groupByParent, showUnmounted }: IFiberInfo) => {
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);

  if (!fiber) {
    return <div className="fiber-info">Fiber with #{fiberId} is not found</div>;
  }

  return (
    <div className="fiber-info">
      <InstanceSwitcher
        fiberId={fiberId}
        typeId={fiber.typeId}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
      />
      <span className="fiber-info__header-type-badge">
        {fiberTypeName[fiber.type]}
      </span>
      <div className="fiber-info__header">
        {fiber.displayName}
        <FiberId id={fiber.id} />
      </div>
      <FiberHeaderNotes fiber={fiber} />
      {false && <FiberInfoSection header="Timing"></FiberInfoSection>}
      {fiber.contexts && (
        <FiberInfoSection header="Contexts" emptyText="no contexts">
          <FiberContexts fiber={fiber} />
        </FiberInfoSection>
      )}
      {fiber.type === ElementTypeProvider && <ConsumersSection fiber={fiber} />}
      {false && <MemoizationSection />}
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
