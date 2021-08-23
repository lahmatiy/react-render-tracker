import React from "react";
import { RenderElementMessage } from "../../types";
import ChangeRowsReason from "./EventRenderReasonsItem";

interface EventRenderReasonsProps {
  changes: RenderElementMessage["changes"];
}

const EventRenderReasons = ({ changes }: EventRenderReasonsProps) => {
  return (
    <tr className="event-render-reasons">
      <td colSpan={4}>
        <table className="event-render-reasons__list">
          <tbody>
            {changes.props && (
              <ChangeRowsReason data={changes.props} type="prop" />
            )}
            {changes.state && (
              <ChangeRowsReason data={changes.state} type="state" />
            )}
            {changes.hooks && (
              <ChangeRowsReason data={changes.hooks} type="hook" />
            )}
          </tbody>
        </table>
      </td>
    </tr>
  );
};

export default EventRenderReasons;
