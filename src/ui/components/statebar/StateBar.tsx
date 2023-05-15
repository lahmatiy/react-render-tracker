import React from "react";
import { useMemoryLeaks } from "../../utils/memory-leaks";
import { Cancel as CancelIcon } from "../common/icons";

function ExposedLeaks() {
  const { exposedLeaks, cancelExposingLeakedObjectsToGlobal } =
    useMemoryLeaks();

  if (!exposedLeaks) {
    return null;
  }

  const fiberCount = exposedLeaks.fiberIds.length;
  const objectCount = exposedLeaks.objectRefsCount;

  return (
    <div className="statebar-exposed-leaks">
      <span className="statebar-exposed-leaks__message">
        <b>{objectCount}</b> potentially leaked React object
        {objectCount > 1 ? "s" : ""} ({fiberCount} fibers) stored as a global
        variable <b>{exposedLeaks.globalName}</b>
      </span>
      <button
        className="statebar-exposed-leaks__cancel-button"
        onClick={cancelExposingLeakedObjectsToGlobal}
      >
        {CancelIcon}
      </button>
    </div>
  );
}

function StateBar() {
  return (
    <div className="statebar">
      <ExposedLeaks />
    </div>
  );
}

const StateBarMemo = React.memo(StateBar);
StateBarMemo.displayName = "StateBar";

export default StateBarMemo;
