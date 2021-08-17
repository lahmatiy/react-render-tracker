import React from "react";
import { ElementEvent } from "../../types";
import EventListItem from "./EventListItem";

interface EventListProps {
  records: ElementEvent[];
}

const EventList = ({ records }: EventListProps) => {
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
        {records.map(({ component, event }) => (
          <EventListItem key={event.id} component={component} event={event} />
        ))}
      </tbody>
    </table>
  );
};

export default EventList;
