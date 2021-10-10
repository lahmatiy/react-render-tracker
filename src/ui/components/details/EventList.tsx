import * as React from "react";
import { LinkedEvent } from "../../types";
import { useEventLog } from "../../utils/events";
import EventListFiberEvent from "./EventListFiberEvent";
import EventListCommitEvent from "./EvetListCommitEvent";

interface EventListProps {
  rootId: number;
  events: ReturnType<typeof useEventLog>;
  showTimings: boolean;
}

const SECTION_SIZE = 50;
const SECTION_MIN_SIZE = 10;
const EventList = ({
  rootId: rootFiberId,
  events,
  showTimings,
}: EventListProps) => {
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, events.length - SECTION_SIZE);
    return offset < SECTION_MIN_SIZE ? 0 : offset;
  });
  const eventElementMap = React.useMemo(
    () => new WeakMap<LinkedEvent, JSX.Element>(),
    [rootFiberId, showTimings]
  );
  const getEventListItem = React.useCallback(
    (
      fiberEvent: LinkedEvent,
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

      const { target, targetId, event } = fiberEvent;
      let element = null;

      switch (target) {
        case "commit":
          element = (
            <EventListCommitEvent
              key={event.id}
              commitId={targetId}
              event={event}
              showTimings={showTimings}
              prevConjunction={prevConjunction}
              nextConjunction={nextConjunction}
            />
          );
          break;

        default:
          element = (
            <EventListFiberEvent
              key={event.id}
              fiberId={targetId}
              event={event}
              showTimings={showTimings}
              prevConjunction={prevConjunction}
              nextConjunction={nextConjunction}
              rootTrigger={rootTrigger}
              indirectRootTrigger={indirectRootTrigger}
            />
          );
      }

      eventElementMap.set(fiberEvent, element);
      return element;
    },
    [rootFiberId, showTimings]
  );

  if (events === null) {
    return null;
  }

  if (!events.length) {
    return <div className="fiber-event-list__no-events">No events found</div>;
  }

  const listEvents = [];
  for (let i = startOffset; i < events.length; i++) {
    const { target, targetId, event, trigger } = events[i];
    const prevCommitId = events[i - 1]?.event?.commitId;
    const nextCommitId = events[i + 1]?.event?.commitId;
    let prevConjunction =
      event.commitId !== -1 && event.commitId === prevCommitId;
    const nextConjunction =
      event.commitId !== -1 && event.commitId === nextCommitId;
    let selfTriggered = false;

    if (target === "fiber" && targetId === rootFiberId && "trigger" in event) {
      if (trigger !== null) {
        listEvents.push(getEventListItem(trigger, false, true, true, true));
        prevConjunction = true;
      } else {
        selfTriggered = true;
      }
    }

    listEvents.push(
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
      <div className="fiber-event-list">{listEvents}</div>
    </>
  );
};

const EventListMemo = React.memo(EventList);
EventListMemo.displayName = "EventList";

export default EventListMemo;
