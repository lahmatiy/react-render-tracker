import * as React from "react";
import { UpdateFiberMessage } from "../../types";
import {
  ContextChange,
  PropChange,
  StateChange,
} from "./EventRenderReasonsItem";

interface EventRenderReasonsProps {
  fiberId: number;
  changes: UpdateFiberMessage["changes"];
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

  return (
    <tr className="event-render-reasons">
      <td
        colSpan={4}
        className={
          "event-render-reasons__wrapper" +
          (nextConjunction ? " event-render-reasons__wrapper_next" : "")
        }
      >
        <div className="event-render-reasons__list">
          {changes.props &&
            changes.props.map((entry, index) => (
              <PropChange key={index} entry={entry} />
            ))}
          {changes.context &&
            changes.context.map((entry, index) => (
              <ContextChange key={index} entry={entry} fiberId={fiberId} />
            ))}
          {changes.state &&
            changes.state.map((entry, index) => (
              <StateChange key={index} entry={entry} />
            ))}
        </div>
      </td>
    </tr>
  );
};

export default EventRenderReasons;
