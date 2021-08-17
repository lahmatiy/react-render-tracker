import React, { useState } from "react";
import List from "react-feather/dist/icons/list";
import Card from "../common/Card";
import ButtonToggle from "../common/ButtonToggle";
import { TreeElement, ElementEvent } from "../../types";
import EventList from "./EventList";

interface DetailsProps {
  data: TreeElement;
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

const Details = ({ data }: DetailsProps) => {
  const [showChildChanges, setShowChildChanges] = useState(true);
  const records = getEventLog(data, showChildChanges);
  let content = null;

  if (!records.length) {
    content = <Card>No events found</Card>;
  } else {
    content = <EventList records={records} />;
  }

  return (
    <Card>
      <div className="element-info__controls">
        <ButtonToggle
          icon={<List />}
          isActive={showChildChanges}
          onChange={setShowChildChanges}
          tooltip="Show child changes"
        />
      </div>
      {content}
    </Card>
  );
};

export default Details;
