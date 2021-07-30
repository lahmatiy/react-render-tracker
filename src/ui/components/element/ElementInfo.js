import React from "react";

import Card from "../ui/Card";
import ChangeRow from "../changes/ChangeRow";

const changes = {"2021-07-30T07:34:39.737Z":{"timestamp":"2021-07-30T07:34:39.737Z","reason":[],"details":{},"phase":"Mount"},"2021-07-30T07:34:39.760Z":{"timestamp":"2021-07-30T07:34:39.760Z","reason":["Hooks Change"],"details":{"hooks":[{"index":2,"prev":{"value":0},"next":{"value":1},"name":"useState"},{"index":3,"prev":{"dependencies":[0]},"next":{"dependencies":[1]},"name":"useEffect"}]},"phase":"Update"},"2021-07-30T07:34:39.981Z":{"timestamp":"2021-07-30T07:34:39.981Z","reason":["Hooks Change"],"details":{"hooks":[{"index":2,"prev":{"value":1},"next":{"value":2},"name":"useState"},{"index":3,"prev":{"dependencies":[1]},"next":{"dependencies":[2]},"name":"useEffect"}]},"phase":"Update"}}

const ElementInfo = ({ data }) => {
  data.changes = changes; // TODO remove

  return (
    <Card>
      <table>
        <thead>
        <tr>
          <th />
          <th>Timestamp</th>
          <th>Phase</th>
          <th>Reason</th>
        </tr>
        </thead>
        <tbody>
        {Object.keys(data.changes || {}).map((timestamp) => {
          const event = data.changes[timestamp];
          return <ChangeRow event={event} timestamp={timestamp} key={timestamp} />
        })}
        </tbody>
      </table>
    </Card>
  );
};

export default ElementInfo;
