import * as React from "react";
import { useEventsContext } from "../../utils/events";
import { useFiberChildren } from "../../utils/fiber-maps";

export default function WaitingForReady({
  children,
}: {
  children: JSX.Element;
}) {
  const fiberRoots = useFiberChildren(0);
  const { loadedEventsCount, totalEventsCount } = useEventsContext();

  if (fiberRoots.length > 0) {
    return children;
  }

  return (
    <div className="waiting-for-ready">
      {totalEventsCount > 0
        ? loadedEventsCount === totalEventsCount
          ? "Rendering..."
          : `Loading events (${Math.trunc(
              (100 * loadedEventsCount) / totalEventsCount
            )}%)...`
        : "Waiting for a React render root to be mounted..."}
    </div>
  );
}
