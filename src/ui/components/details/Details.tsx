import * as React from "react";
import List from "react-feather/dist/icons/list";
import ButtonToggle from "../common/ButtonToggle";
import EventList from "./EventList";
import ElementId from "../common/ElementId";
import { useComponent } from "../../utils/component-maps";
import { useEventLog } from "../../utils/events";

interface DetailsProps {
  componentId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}

const Details = ({
  componentId,
  groupByParent,
  showUnmounted,
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
          icon={<List />}
          isActive={showSubtreeEvents}
          onChange={setShowSubtreeEvents}
          tooltip="Show child changes"
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
        />
      )}
    </div>
  );
};

const DetailsMemo = React.memo(Details);
DetailsMemo.displayName = "Details";

export default DetailsMemo;
