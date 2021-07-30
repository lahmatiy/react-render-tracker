import React from "react";

import Card from "../ui/Card";
import ChangeRow from "../changes/ChangeRow";

// TODO dummy data remove after works
const changes = {
  "2021-07-30T07:34:39.737Z": {
    timestamp: "2021-07-30T07:34:39.737Z",
    reason: [],
    details: {},
    phase: "Mount",
  },
  "2021-07-30T07:34:39.760Z": {
    timestamp: "2021-07-30T07:34:39.760Z",
    reason: ["Hooks Change"],
    details: {
      hooks: [
        {
          index: 2,
          prev: { value: 0 },
          next: { value: 1 },
          name: "useState",
        },
        {
          index: 3,
          prev: { dependencies: [0] },
          next: { dependencies: [1] },
          name: "useEffect",
        },
      ],
    },
    phase: "Update",
  },
  "2021-07-30T07:34:39.981Z": {
    timestamp: "2021-07-30T07:34:39.981Z",
    reason: ["Hooks Change"],
    details: {
      props: [
        {
          key: "test",
          prev: "1",
          next: "2",
        },
      ],
      state: [
        {
          key: "test",
          prev: "1",
          next: "2",
        },
      ],
      hooks: [
        {
          index: 2,
          prev: { value: 1 },
          next: { value: 2 },
          name: "useState",
        },
        {
          index: 3,
          prev: { dependencies: [1] },
          next: { dependencies: [2] },
          name: "useEffect",
        },
      ],
    },
    phase: "Update",
  },
};

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

const ElementInfo = ({ data, showChildChanges }) => {
  return (
    <Card>
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
                <ChangeRow {...change} key={change.timestamp + elementId} />
              );
            }
          )}
        </tbody>
      </table>
    </Card>
  );
};

export default ElementInfo;
