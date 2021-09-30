import * as React from "react";
import { FiberEvent } from "../../types";
import { useEventLog } from "../../utils/events";
import EventListItem from "./EventListItem";

interface EventListProps {
  rootId: number;
  events: ReturnType<typeof useEventLog>;
  showTimings: boolean;
}

const SECTION_SIZE = 50;
const SECTION_MIN_SIZE = 10;
const EventList = ({ rootId, events, showTimings }: EventListProps) => {
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, events.length - SECTION_SIZE);
    return offset < SECTION_MIN_SIZE ? 0 : offset;
  });
  const eventElementMap = React.useMemo(
    () => new WeakMap<FiberEvent, JSX.Element>(),
    [rootId, showTimings]
  );
  const getEventListItem = React.useCallback(
    (
      fiberEvent: FiberEvent,
      prevConjunction: boolean,
      nextConjunction: boolean,
      rootTrigger: boolean,
      indirectRootTrigger: boolean
    ) => {
      const existing = eventElementMap.get(fiberEvent);

      if (
        existing &&
        existing.props.prevConjunction === prevConjunction &&
        existing.props.nextConjunction === nextConjunction &&
        existing.props.rootTrigger === rootTrigger &&
        existing.props.indirectRootTrigger === indirectRootTrigger
      ) {
        return existing;
      }

      const { fiberId, event } = fiberEvent;
      const element = (
        <EventListItem
          key={event.id}
          fiberId={fiberId}
          event={event}
          showTimings={showTimings}
          prevConjunction={prevConjunction}
          nextConjunction={nextConjunction}
          rootTrigger={rootTrigger}
          indirectRootTrigger={indirectRootTrigger}
        />
      );

      eventElementMap.set(fiberEvent, element);
      return element;
    },
    [rootId, showTimings]
  );

  if (events === null) {
    return null;
  }

  if (!events.length) {
    return <div className="fiber-event-list__no-events">No events found</div>;
  }

  const fiberEvents = [];
  for (let i = startOffset; i < events.length; i++) {
    const { fiberId, event, trigger, triggeredByOwner } = events[i];
    const prevCommitId = events[i - 1]?.event?.commitId;
    const nextCommitId = events[i + 1]?.event?.commitId;
    let prevConjunction =
      event.commitId !== -1 && event.commitId === prevCommitId;
    const nextConjunction =
      event.commitId !== -1 && event.commitId === nextCommitId;
    let selfTriggered = false;

    if (fiberId === rootId && event.op === "update") {
      if (trigger !== null) {
        fiberEvents.push(
          getEventListItem(trigger, false, true, true, !triggeredByOwner)
        );
        prevConjunction = true;
      } else {
        selfTriggered = true;
      }
    }

    fiberEvents.push(
      getEventListItem(
        events[i],
        prevConjunction,
        nextConjunction,
        selfTriggered,
        false
      )
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
      <div className="fiber-event-list">{fiberEvents}</div>
    </>
  );
};

const EventListMemo = React.memo(EventList);
EventListMemo.displayName = "EventList";

export default EventListMemo;
