import * as React from "react";
import ChangeRow from "./ChangeRow";
import { ElementEvent } from "../../types";

interface IEventList {
  records: ElementEvent[];
}

const EventList = ({ records }: IEventList) => {
  return (
    <table className="element-info-table">
      <thead>
        <tr>
          <th />
          <th>Timestamp</th>
          <th>Event</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {records.map(({ component, event }, idx) => {
          return <ChangeRow key={idx} component={component} event={event} />;
        })}
      </tbody>
    </table>
  );
};

export default EventList;
