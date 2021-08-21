import React from "react";
import { ElementEvent } from "../../types";
import EventListItem from "./EventListItem";

interface EventListProps {
  records: ElementEvent[];
}

const EventList = ({ records }: EventListProps) => {
  return (
    <table className="element-event-list">
      <tbody>
        {records.map(({ component, event }) => (
          <EventListItem key={event.id} component={component} event={event} />
        ))}
      </tbody>
    </table>
  );
};

export default EventList;
