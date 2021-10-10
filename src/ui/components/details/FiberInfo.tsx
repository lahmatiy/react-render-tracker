import * as React from "react";
import { MessageFiber } from "../../types";
import { useFiberMaps, useProviderCustomers } from "../../utils/fiber-maps";
import { ElementTypeProvider } from "../../../common/constants";
import { CallStackList } from "./CallStack";
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
      {null && fiber.contexts && (
        <FiberInfoSection header="Contexts" emptyText="no contexts">
          <FiberContexts fiber={fiber} />
        </FiberInfoSection>
      )}
      {null && fiber.type === ElementTypeProvider && (
        <ConsumersSection fiber={fiber} />
      )}
      {false && <MemoizationSection />}
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
