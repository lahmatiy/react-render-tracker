import * as React from "react";
import { useEventsContext } from "../../utils/events";
import { useFiberChildren } from "../../utils/fiber-maps";

export default function WaitingForReady() {
  const [visible, setVisible] = React.useState(false);
  const children = useFiberChildren(0);
  const { loadedEventsCount, totalEventsCount } = useEventsContext();

  // Use effect to trigger a transition
  React.useEffect(() => {
    setVisible(true);
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
