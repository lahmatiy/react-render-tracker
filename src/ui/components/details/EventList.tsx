import * as React from "react";
import { useEventLog } from "../../utils/events";
import EventListItem from "./EventListItem";

interface EventListProps {
  events: ReturnType<typeof useEventLog>;
  showTimings: boolean;
}

const SECTION_SIZE = 50;
const SECTION_MIN_SIZE = 10;
const EventList = ({ events, showTimings }: EventListProps) => {
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, events.length - SECTION_SIZE);
    return offset < SECTION_MIN_SIZE ? 0 : offset;
  });

  if (events === null) {
    return null;
  }

  if (!events.length) {
    return <div className="fiber-event-list__no-events">No events found</div>;
  }

  const fiberEvents = [];
  for (let i = startOffset; i < events.length; i++) {
    const { fiber, event } = events[i];
    const prevCommitId = events[i - 1]?.event?.commitId;
    const nextCommitId = events[i + 1]?.event?.commitId;

    fiberEvents.push(
      <EventListItem
        key={event.id}
        fiber={fiber}
        event={event}
        showTimings={showTimings}
        prevConjunction={
          event.commitId !== -1 && event.commitId === prevCommitId
        }
        nextConjunction={
          event.commitId !== -1 && event.commitId === nextCommitId
        }
      />
    );
  }

  return (
    <>
      {startOffset > 0 && (
        <div className="fiber-event-list__show-more">
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
      <table className="fiber-event-list">
        <tbody>{fiberEvents}</tbody>
      </table>
    </>
  );
};

const EventListMemo = React.memo(EventList);
EventListMemo.displayName = "EventList";

export default EventListMemo;
