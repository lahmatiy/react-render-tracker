import * as React from "react";
import { useEventLog } from "../../utils/events";
import EventListItem from "./EventListItem";

interface EventListProps {
  events: ReturnType<typeof useEventLog>;
}

const sectionSize = 50;
const sectionMinSize = 10;
const EventList = ({ events }: EventListProps) => {
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, events.length - sectionSize);
    return offset < sectionMinSize ? 0 : offset;
  });

  if (events === null) {
    return null;
  }

  if (!events.length) {
    return <div>No events found</div>;
  }

  return (
    <>
      {startOffset > 0 && (
        <div className="element-event-list__show-more">
          {startOffset > sectionSize + sectionMinSize && (
            <button
              onClick={() =>
                setStartOffset(Math.max(0, startOffset - sectionSize))
              }
            >
              Show {Math.min(startOffset, sectionSize)} more...
            </button>
          )}
          <button onClick={() => setStartOffset(0)}>
            Show all the rest {startOffset}...
          </button>
        </div>
      )}
      <table className="element-event-list">
        <tbody>
          {events.slice(startOffset).map(({ component, event }) => (
            <EventListItem key={event.id} component={component} event={event} />
          ))}
        </tbody>
      </table>
    </>
  );
};

export default EventList;
