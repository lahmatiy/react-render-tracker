import * as React from "react";
import { RenderElementMessage } from "../../types";
import EventRenderReasonsItem from "./EventRenderReasonsItem";

interface EventRenderReasonsProps {
  changes: RenderElementMessage["changes"];
}

const EventRenderReasons = ({ changes }: EventRenderReasonsProps) => {
  if (!changes) {
    return <>Unknown changes</>;
  }

  return (
    <tr className="event-render-reasons">
      <td colSpan={4}>
        <table className="event-render-reasons__list">
          <tbody>
            {changes.props && (
              <EventRenderReasonsItem data={changes.props} type="prop" />
            )}
            {changes.state && (
              <EventRenderReasonsItem data={changes.state} type="state" />
            )}
            {changes.hooks && (
              <EventRenderReasonsItem data={changes.hooks} type="hook" />
            )}
            {changes.context && (
              <EventRenderReasonsItem data={changes.context} type="context" />
            )}
          </tbody>
        </table>
      </td>
    </tr>
  );
};

export default EventRenderReasons;
