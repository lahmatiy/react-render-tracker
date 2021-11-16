import * as React from "react";
import { FiberEvent } from "../../../types";
import {
  ContextChange,
  PropChange,
  StateChange,
} from "./EventRenderReasonsItem";

interface EventRenderReasonsProps {
  fiberId: number;
  changes: FiberEvent["changes"];
  nextConjunction: boolean;
}

const EventRenderReasons = ({
  fiberId,
  changes,
  nextConjunction,
}: EventRenderReasonsProps) => {
  if (!changes) {
    return <>Unknown changes</>;
  }

  const warn = changes.warnings || new Set();

  return (
    <div
      className={
        "event-render-reasons" +
        (nextConjunction ? " event-render-reasons_next" : "")
      }
    >
      <div className="event-render-reasons__list">
        {changes.props?.map((entry, index) => (
          <PropChange key={index} entry={entry} warn={warn.has(entry)} />
        ))}
        {changes.context?.map((entry, index) => (
          <ContextChange key={index} entry={entry} fiberId={fiberId} />
        ))}
        {changes.state?.map((entry, index) => (
          <StateChange key={index} entry={entry} warn={warn.has(entry)} />
        ))}
      </div>
    </div>
  );
};

export default EventRenderReasons;
