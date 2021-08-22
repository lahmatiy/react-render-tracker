import React, { useState } from "react";
import List from "react-feather/dist/icons/list";
import ButtonToggle from "../common/ButtonToggle";
import { TreeElement } from "../../types";
import EventList from "./EventList";

interface DetailsProps {
  data: TreeElement;
}

const Details = ({ data }: DetailsProps) => {
  const [showChildChanges, setShowChildChanges] = useState(true);

  return (
    <div className="details">
      <div className="details__controls">
        <ButtonToggle
          icon={<List />}
          isActive={showChildChanges}
          onChange={setShowChildChanges}
          tooltip="Show child changes"
        />
      </div>
      <EventList
        key={data.id} // to reset state of visible records on component change
        data={data}
        showChildChanges={showChildChanges}
      />
    </div>
  );
};

export default Details;
