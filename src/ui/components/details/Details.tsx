import React, { useState } from "react";
import List from "react-feather/dist/icons/list";
import ButtonToggle from "../common/ButtonToggle";
import { TreeElement } from "../../types";
import EventList from "./EventList";
import ElementId from "../common/ElementId";

interface DetailsProps {
  component: TreeElement;
}

const Details = ({ component }: DetailsProps) => {
  const [showChildChanges, setShowChildChanges] = useState(true);

  return (
    <div className="details">
      <div className="details__header">
        <div className="details__header-caption">
          Events of {showChildChanges && "subtree of"}{" "}
          <span className={"details__header-component-name"}>
            {component.displayName ||
              (!component.ownerId ? "Render root" : "Unknown")}
          </span>
          <ElementId id={component.id} />
        </div>
        <ButtonToggle
          icon={<List />}
          isActive={showChildChanges}
          onChange={setShowChildChanges}
          tooltip="Show child changes"
        />
      </div>
      <EventList
        key={component.id} // to reset state of visible records on component change
        component={component}
        showChildChanges={showChildChanges}
      />
    </div>
  );
};

export default Details;
