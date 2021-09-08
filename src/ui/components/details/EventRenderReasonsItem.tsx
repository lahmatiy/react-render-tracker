import * as React from "react";

interface KeyedReason {
  name: string;
  prev: string;
  next: string;
}
interface HookReason {
  name: string;
  changed: boolean;
}
interface EventRenderReasonsItemProps {
  type: "prop" | "state" | "hook" | "context";
  data: KeyedReason[] | HookReason[];
}

const EventRenderReasonsItem = ({
  type,
  data,
}: EventRenderReasonsItemProps) => {
  return (
    <>
      {data.map((row, index) => {
        return (
          <tr key={index} className="event-render-reason">
            <td>
              <span className="event-render-reason__type">{type}</span>
            </td>
            <td>{row.name}</td>
            <td className="event-render-reason__value-change">
              {"prev" in row && (
                <>
                  <code>{row.prev}</code>
                  &nbsp;→&nbsp;
                  <code>{row.next}</code>
                </>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default EventRenderReasonsItem;
