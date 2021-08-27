import * as React from "react";
import { useEventLog } from "../../utils/events";
import EventListItem from "./EventListItem";

interface EventListProps {
  events: ReturnType<typeof useEventLog>;
}

const SECTION_SIZE = 50;
const SECTION_MIN_SIZE = 10;
const EventList = ({ events }: EventListProps) => {
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, events.length - SECTION_SIZE);
    return offset < SECTION_MIN_SIZE ? 0 : offset;
  });

  if (events === null) {
    return null;
  }

  if (!events.length) {
    return <div className="element-event-list__no-events">No events found</div>;
  }

  return (
    <>
      {startOffset > 0 && (
        <div className="element-event-list__show-more">
          {startOffset > SECTION_SIZE + SECTION_MIN_SIZE && (
            <button
              onClick={() =>
                setStartOffset(Math.max(0, startOffset - SECTION_SIZE))
              }
            >
              Show {Math.min(startOffset, SECTION_SIZE)} more...
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

const EventListMemo = React.memo(EventList);
EventListMemo.displayName = "EventList";

export default EventListMemo;
