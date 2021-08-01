import React, { useState } from "react";
import List from "react-feather/dist/icons/list";
import Card from "../ui/Card";
import ButtonToggle from "../ui/ButtonToggle";
import EventList from "../changes/EventList";
import { TreeElement, ElementEvent } from "../../types";

interface IElementInfo {
  data: TreeElement;
}

function getEventLog(component: TreeElement, showChildChanges = false) {
  if (showChildChanges) {
    const queue = new Set([component]);
    const combinedChanges: ElementEvent[] = [];

    for (const component of queue) {
      for (const event of component.updates) {
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

    combinedChanges.sort(
      (a, b) =>
        a.event.timestamp - b.event.timestamp || a.component.id - b.component.id
    );

    return combinedChanges;
  } else {
    return component.updates.map(event => ({
      component,
      event,
    }));
  }
}

const ElementInfo = ({ data }: IElementInfo) => {
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

export default ElementInfo;
