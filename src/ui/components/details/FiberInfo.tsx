import * as React from "react";
import { MessageFiber } from "../../types";
import { useFiber } from "../../utils/fiber-maps";
import FiberId from "../common/FiberId";
import { CallStackList } from "./CallStack";

interface IFiberInfo {
  fiberId: number;
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
            <span className="fiber-info-fiber-context-name">{name}</span>
            {providerId && <FiberId id={providerId} />}
            {reads && (
              <div className="fiber-info-fiber-context-reads">
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

function FiberInfo({ fiberId }: IFiberInfo) {
  const fiber = useFiber(fiberId);

  if (!fiber) {
    return <div className="fiber-info">Fiber with #{fiberId} is not found</div>;
  }

  return (
    <div className="fiber-info">
      <div className="fiber-info__header">
        {fiber.displayName}
        <FiberId id={fiber.id} />
      </div>
      {false && <FiberInfoSection header="Timing"></FiberInfoSection>}
      <FiberInfoSection header="Contexts" emptyText="no contexts">
        {fiber.contexts && <FiberContexts fiber={fiber} />}
      </FiberInfoSection>
      {false && <MemoizationSection fiber={fiber as MessageFiber} />}
    </div>
  );
}

export default FiberInfo;
