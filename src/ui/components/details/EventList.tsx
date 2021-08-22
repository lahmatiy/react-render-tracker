import * as React from "react";
import { ElementEvent, TreeElement } from "../../types";
import EventListItem from "./EventListItem";

interface EventListProps {
  data: TreeElement;
  showChildChanges: boolean;
}

function getEventLog(component: TreeElement, showChildChanges = false) {
  if (showChildChanges) {
    const queue = new Set([component]);
    const combinedChanges: ElementEvent[] = [];

    for (const component of queue) {
      for (const event of component.events) {
        combinedChanges.push({
          component,
          event,
        });
      }

      if (component.children) {
        for (const child of component.children) {
          queue.add(child);
        }
      }
    }

    return combinedChanges.sort((a, b) => a.event.id - b.event.id);
  } else {
    return component.events.map(event => ({
      component,
      event,
    }));
  }
}

const sectionSize = 50;
const sectionMinSize = 10;
const EventList = ({ data, showChildChanges }: EventListProps) => {
  const records = getEventLog(data, showChildChanges);
  const [startOffset, setStartOffset] = React.useState(() => {
    const offset = Math.max(0, records.length - sectionSize);
    return offset < sectionMinSize ? 0 : offset;
  });

  if (!records.length) {
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
          {records.slice(startOffset).map(({ component, event }) => (
            <EventListItem key={event.id} component={component} event={event} />
          ))}
        </tbody>
      </table>
    </>
  );
};

export default EventList;
