import * as React from "react";
import { MessageFiber } from "../../types";
import { useFiberMaps, useTypeIdFibers } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import { ChevronUp, ChevronDown } from "../common/icons";
import { fiberTypeName } from "../../../common/constants";
import { useSelectedId } from "../../utils/selection";
import { CallStackList } from "./CallStack";
import { FiberLink } from "./FiberLink";

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

interface IFiberMemoizationSection {
  fiber: MessageFiber;
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

function MemoizationSection({}: IFiberMemoizationSection) {
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
  const typeInstances = useTypeIdFibers(typeId);
  const { select } = useSelectedId();
  const { selectTree } = useFiberMaps();
  const tree = selectTree(groupByParent, showUnmounted);
  const typeInstancesSet = React.useMemo(
    () => new Set(typeInstances),
    [typeInstances]
  );
  const index = React.useMemo(() => {
    let result = 1;

    tree.walkBack(node => {
      result += typeInstancesSet.has(node.id) ? 1 : 0;
    }, fiberId);

    return result;
  }, [tree, typeInstancesSet, fiberId]);

  return (
    <div className="fiber-info-instance-iterator">
      <span className="fiber-info-instance-iterator__label">
        {index} / {typeInstances.length}
      </span>
      <span className="fiber-info-instance-iterator__buttons">
        <button
          className="fiber-info-instance-iterator__button"
          onClick={() => {
            tree.walkBack(
              node => {
                if (typeInstancesSet.has(node.id)) {
                  select(node.id);
                  return true;
                }
                return;
              },
              index > 1 ? fiberId : undefined
            );
          }}
        >
          {ChevronUp}
        </button>
        <button
          className="fiber-info-instance-iterator__button"
          onClick={() => {
            tree.walk(
              node => {
                if (typeInstancesSet.has(node.id)) {
                  select(node.id);
                  return true;
                }
                return;
              },
              index < typeInstances.length ? fiberId : undefined
            );
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
      {false && <MemoizationSection fiber={fiber as MessageFiber} />}
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
