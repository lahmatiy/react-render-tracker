import * as React from "react";
import { SubtreeToggle } from "../common/icons";
import ButtonToggle from "../common/ButtonToggle";
import EventList from "./EventList";
import FiberId from "../common/FiberId";
import { useFiber } from "../../utils/fiber-maps";
import { useEventLog } from "../../utils/events";

interface DetailsProps {
  rootId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}

const Details = ({
  rootId,
  groupByParent = false,
  showUnmounted = true,
  showTimings = false,
}: DetailsProps) => {
  const [showSubtreeEvents, setShowSubtreeEvents] = React.useState(true);
  const fiber = useFiber(rootId);
  const events = useEventLog(
    rootId,
    groupByParent,
    showUnmounted,
    showSubtreeEvents
  );

  return (
    <div className="details">
      <div className="details__header">
        <div className="details__header-caption">
          Events of {showSubtreeEvents && "subtree of"}{" "}
          {fiber ? (
            <>
              <span className={"details__header-component-name"}>
                {fiber.displayName ||
                  (!fiber.ownerId ? "Render root" : "Unknown")}
              </span>
              <FiberId id={fiber.id} />
            </>
          ) : (
            "Unknown"
          )}
        </div>
        <ButtonToggle
          icon={SubtreeToggle}
          isActive={showSubtreeEvents}
          onChange={setShowSubtreeEvents}
          tooltip={
            showSubtreeEvents
              ? "Show component's events only"
              : "Show component and its subtree components events"
          }
        />
      </div>
      {events && (
        <EventList
          // key used to reset state of visible records on component & settings change
          key={[rootId, groupByParent, showUnmounted, showSubtreeEvents].join(
            "-"
          )}
          events={events}
          showTimings={showTimings}
        />
      )}
    </div>
  );
};

const DetailsMemo = React.memo(Details);
DetailsMemo.displayName = "Details";

export default DetailsMemo;
