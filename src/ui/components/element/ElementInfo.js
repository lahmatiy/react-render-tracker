import React, { useState } from "react";
import List from "react-feather/dist/icons/list";

import Card from "../ui/Card";
import ChangeRow from "../changes/ChangeRow";
import ButtonToggle from "../ui/ButtonToggle";

function getChanges(component, showChildChanges) {
  if (showChildChanges) {
    const queue = new Set([component]);
    const combinedChanges = [];

    for (const { updates, id, children, displayName } of queue) {
      const changesForCurrentNode = updates.map(update => ({
        ...update,
        elementId: id,
        displayName,
      }));

      combinedChanges.push(...changesForCurrentNode);

      if (children) {
        for (const child of children) {
          queue.add(child);
        }
      }
    }

    combinedChanges.sort((a, b) => {
      const dateA = a.timestamp;
      const dateB = b.timestamp;

      return dateA === dateB ? a.elementId - b.elementId : dateA - dateB;
    });

    return combinedChanges;
  } else {
    return component.updates;
  }
}

const ElementInfo = ({ data }) => {
  const [showChildChanges, setShowChildChanges] = useState(false);

  return (
    <Card>
      <div className="element-info__controls">
        <ButtonToggle
          Icon={List}
          isActive={showChildChanges}
          onChange={setShowChildChanges}
          tooltip="Show child changes"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th />
            {showChildChanges && <th>Component</th>}
            <th>Timestamp</th>
            <th>Phase</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {getChanges(data, showChildChanges).map(
            ({ elementId = "", ...change }, idx) => {
              return <ChangeRow {...change} elementId={elementId} key={idx} />;
            }
          )}
        </tbody>
      </table>
    </Card>
  );
};

export default ElementInfo;
