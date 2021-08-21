import React from "react";
import { RenderElementMessage } from "../../types";
import ChangeRowsReason from "./EventRenderReason";

interface EventRenderReasonDetailsProps {
  changes: RenderElementMessage["changes"];
}

const EventRenderReasonDetails = ({
  changes,
}: EventRenderReasonDetailsProps) => {
  return (
    <tr>
      <td colSpan={4}>
        <table className="table-change-details">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Previous =&gt; Next</th>
            </tr>
          </thead>
          <tbody>
            {changes.props && (
              <ChangeRowsReason data={changes.props} type="Props" />
            )}
            {changes.state && (
              <ChangeRowsReason data={changes.state} type="State" />
            )}
            {changes.hooks && (
              <ChangeRowsReason data={changes.hooks} type="Hooks" />
            )}
          </tbody>
        </table>
      </td>
    </tr>
  );
};

export default EventRenderReasonDetails;
