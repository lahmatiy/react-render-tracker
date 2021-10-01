import * as React from "react";
import { useEventsContext } from "../../utils/events";
import { useFiberChildren } from "../../utils/fiber-maps";

export default function WaitingForReady() {
  const [visible, setVisible] = React.useState(false);
  const children = useFiberChildren(0);
  const { loadedEventsCount, totalEventsCount } = useEventsContext();

  // Delay appearing to give a chance to receive some events before
  // displaying awaiting caption
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (children.length > 0) {
    return null;
  }

  return (
    <div className={"waiting-for-ready" + (visible ? " visible" : "")}>
      {totalEventsCount > 0
        ? loadedEventsCount === totalEventsCount
          ? "Rendering..."
          : `Loading events (${Math.trunc(
              (100 * loadedEventsCount) / totalEventsCount
            )}%)...`
        : "Waiting for a React's render root to be mount..."}
    </div>
  );
}
