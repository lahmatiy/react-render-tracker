import * as React from "react";
import { SubtreeToggle } from "../common/icons";
import ButtonToggle from "../common/ButtonToggle";
import EventList from "./EventList";
import ElementId from "../common/ElementId";
import { useComponent } from "../../utils/component-maps";
import { useEventLog } from "../../utils/events";

interface DetailsProps {
  componentId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}

const Details = ({
  componentId,
  groupByParent = false,
  showUnmounted = true,
  showTimings = false,
}: DetailsProps) => {
  const [showSubtreeEvents, setShowSubtreeEvents] = React.useState(true);
  const component = useComponent(componentId);
  const events = useEventLog(
    componentId,
    groupByParent,
    showUnmounted,
    showSubtreeEvents
  );

  return (
    <div className="details">
      <div className="details__header">
        <div className="details__header-caption">
          Events of {showSubtreeEvents && "subtree of"}{" "}
          {component ? (
            <>
              <span className={"details__header-component-name"}>
                {component.displayName ||
                  (!component.ownerId ? "Render root" : "Unknown")}
              </span>
              <ElementId id={component.id} />
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
          key={[
            componentId,
            groupByParent,
            showUnmounted,
            showSubtreeEvents,
          ].join("-")}
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
