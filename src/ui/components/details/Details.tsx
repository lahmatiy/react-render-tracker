import React, { useState } from "react";
import List from "react-feather/dist/icons/list";
import ButtonToggle from "../common/ButtonToggle";
import EventList from "./EventList";
import ElementId from "../common/ElementId";
import { useComponent } from "../../utils/global-maps";

interface DetailsProps {
  componentId: number;
}

const Details = ({ componentId }: DetailsProps) => {
  const [showSubtreeEvents, setShowSubtreeEvents] = useState(true);
  const component = useComponent(componentId);

  return (
    <div className="details">
      <div className="details__header">
        <div className="details__header-caption">
          Events of {showSubtreeEvents && "subtree of"}{" "}
          <span className={"details__header-component-name"}>
            {component.displayName ||
              (!component.ownerId ? "Render root" : "Unknown")}
          </span>
          <ElementId id={component.id} />
        </div>
        <ButtonToggle
          icon={<List />}
          isActive={showSubtreeEvents}
          onChange={setShowSubtreeEvents}
          tooltip="Show child changes"
        />
      </div>
      <EventList
        key={componentId} // to reset state of visible records on component change
        componentId={componentId}
        showSubtreeEvents={showSubtreeEvents}
      />
    </div>
  );
};

export default Details;
