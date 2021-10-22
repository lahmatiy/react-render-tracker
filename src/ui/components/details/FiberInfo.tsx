import * as React from "react";
import {
  MessageFiber,
  TransferFiberContext,
  TransferCallTrace,
  TransferDepChange,
} from "../../types";
import {
  useFiber,
  useFiberMaps,
  useProviderCustomers,
} from "../../utils/fiber-maps";
import { ElementTypeProvider } from "../../../common/constants";
import { CallTraceList, CallTracePath } from "./CallStack";
import { FiberLink } from "./FiberLink";
import { FiberInfoHeader } from "./FiberInfoHeader";
import SourceLoc from "../common/SourceLoc";
import { Diff } from "./diff/Diff";

interface IFiberInfo {
  fiberId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}

interface IFiberInfoSection {
  header: string;
  emptyText?: string;
  children?: JSX.Element | JSX.Element[] | string | null;
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
  const { typeDef } = fiber;

  if (!Array.isArray(typeDef.contexts)) {
    return null;
  }

  const contextReadMap = typeDef.hooks.reduce((map, hook) => {
    if (hook.context) {
      const traces = map.get(hook.context);
      if (traces === undefined) {
        map.set(hook.context, [hook.trace]);
      } else {
        traces.push(hook.trace);
      }
    }
    return map;
  }, new Map<TransferFiberContext, TransferCallTrace[]>());

  return (
    <>
      {typeDef.contexts.map((context, index) => {
        const traces = contextReadMap.get(context);

        return (
          <div key={index}>
            {context.providerId !== undefined ? (
              <FiberLink id={context.providerId} name={context.name} />
            ) : (
              <>
                {context.name}{" "}
                <span className="fiber-info-fiber-context__no-provider">
                  No provider found
                </span>
              </>
            )}
            {traces && (
              <div className="fiber-info-fiber-context__reads">
                <CallTraceList expanded compat={false} traces={traces} />
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

function MemoizationSection({ fiber }: { fiber: MessageFiber }) {
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

const FiberInfo = ({ fiberId, groupByParent, showUnmounted }: IFiberInfo) => {
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);

  if (fiber === undefined) {
    return <div className="fiber-info">Fiber with #{fiberId} is not found</div>;
  }

  return (
    <div className="fiber-info">
      <FiberInfoHeader
        fiber={fiber}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
      />

      {false && <FiberInfoSection header="Timing"></FiberInfoSection>}
      {fiber.typeDef.contexts && (
        <FiberInfoSection header="Contexts" emptyText="no contexts">
          <FiberContexts fiber={fiber} />
        </FiberInfoSection>
      )}
      {fiber.type === ElementTypeProvider && <ConsumersSection fiber={fiber} />}
      <MemoizationSection fiber={fiber} />
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
