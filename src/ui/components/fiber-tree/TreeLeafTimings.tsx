import React from "react";
import { MessageFiber } from "../../types";
import { formatDuration } from "../../utils/duration";

const TreeLeafTimings = ({ fiber }: { fiber: MessageFiber }) => {
  const { events, selfTime, totalTime } = fiber;

  return (
    <div className="tree-leaf-timings">
      <span className="tree-leaf-timings__time" title="Self time">
        {events.length > 0 ? formatDuration(selfTime) : "\xA0"}
      </span>
      <span className="tree-leaf-timings__time" title="Total time">
        {events.length > 0 ? formatDuration(totalTime) : "\xA0"}
      </span>
    </div>
  );
};

const TreeLeafTimingsMemo = React.memo(TreeLeafTimings);
TreeLeafTimingsMemo.displayName = "TreeLeafTimings";

export default TreeLeafTimingsMemo;
