import * as React from "react";
import { UpdateFiberMessage } from "../../types";
import EventRenderReasonsItem from "./EventRenderReasonsItem";

interface EventRenderReasonsProps {
  changes: UpdateFiberMessage["changes"];
}

const EventRenderReasons = ({ changes }: EventRenderReasonsProps) => {
  if (!changes) {
    return <>Unknown changes</>;
  }

  return (
    <tr className="event-render-reasons">
      <td colSpan={4}>
        <div className="event-render-reasons__list">
          {changes.props && (
            <EventRenderReasonsItem data={changes.props} type="prop" />
          )}
          {changes.context && (
            <EventRenderReasonsItem data={changes.context} type="context" />
          )}
          {changes.state && (
            <EventRenderReasonsItem data={changes.state} type="state" />
          )}
        </div>
      </td>
    </tr>
  );
};

export default EventRenderReasons;
