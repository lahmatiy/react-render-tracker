import React, { useState } from "react";
import List from "react-feather/dist/icons/list";

import Card from "../ui/Card";
import ChangeRow from "../changes/ChangeRow";
import ButtonToggle from "../ui/ButtonToggle";

function getChanges(data, showChildChanges) {
  const { changes } = data;

  if (showChildChanges) {
    const stack = [data];
    const combinedChanges = [];

    while (stack.length) {
      const { changes, id, children, displayName } = stack.pop();

      const changesForCurrentNode = Object.keys(changes || {}).map(
        timestamp => {
          const event = changes[timestamp];

          return {
            event,
            timestamp,
            elementId: id,
            displayName,
          };
        }
      );

      combinedChanges.push(...changesForCurrentNode);

      if (children && children.length) {
        stack.push(...children);
      }
    }

    combinedChanges.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);

      if (dateA === dateB) {
        return a.elementId - b.elementId;
      } else {
        return dateA - dateB;
      }
    });

    return combinedChanges;
  } else {
    return Object.keys(changes || {}).map(timestamp => {
      const event = data.changes[timestamp];

      return {
        event,
        timestamp,
      };
    });
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
            ({ elementId = "", ...change }) => {
              return (
                <ChangeRow
                  {...change}
                  elementId={elementId}
                  key={change.timestamp + elementId}
                />
              );
            }
          )}
        </tbody>
      </table>
    </Card>
  );
};

export default ElementInfo;
