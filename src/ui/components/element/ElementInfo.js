import React from 'react';

import Card from '../ui/Card';

const ElementInfo = ({ data }) => {
  return (
    <div>
      <Card>
        <table>
          <thead>
          <tr>
            <th>Timestamp</th>
            <th>Phase</th>
            <th>Reason</th>
          </tr>
          </thead>
          <tbody>
          {data.lifecycle.map((event, i) => (
            <tr key={event.timestamp + i}>
              <td>{event.timestamp}</td>
              <td>{event.phase}</td>
              <td>{event.reason}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default ElementInfo;
