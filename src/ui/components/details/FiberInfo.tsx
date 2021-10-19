import * as React from "react";
import {
  MessageFiber,
  TransferFiberContext,
  TransferCallTrace,
} from "../../types";
import { useFiberMaps, useProviderCustomers } from "../../utils/fiber-maps";
import { ElementTypeProvider } from "../../../common/constants";
import { CallTraceList } from "./CallStack";
import { FiberLink } from "./FiberLink";
import { FiberInfoHeader } from "./FiberInfoHeader";

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

function MemoizationSection() {
  return <FiberInfoSection header="Memoization">TBD</FiberInfoSection>;
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
      {false && <MemoizationSection />}
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
