import * as React from "react";
import { MessageFiber } from "../../../types";
import { useEventLog } from "../../../utils/events";
import ButtonToggle from "../../common/ButtonToggle";
import { SubtreeToggle } from "../../common/icons";
import EventList from "../event-list/EventList";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionEvents({
  fiber,
  groupByParent,
  showUnmounted,
  showTimings,
}: {
  fiber: MessageFiber;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}) {
  const [showSubtreeEvents, setShowSubtreeEvents] = React.useState(false);
  const events = useEventLog(
    fiber.id,
    groupByParent,
    showUnmounted,
    showSubtreeEvents
  );

  return (
    <FiberInfoSection
      id="events"
      header={`${"Events"} (${events.length})`}
      emptyText="No events"
      expandedOpts={
        <ButtonToggle
          icon={SubtreeToggle}
          isActive={showSubtreeEvents}
          onChange={setShowSubtreeEvents}
          className="fiber-info-section-events__subtree-toggle"
          tooltip={
            showSubtreeEvents
              ? "Show component's events only"
              : "Include events for descendant components of selected component"
          }
        />
      }
    >
      <div className="fiber-info-section-events">
        <EventList
          // key used to reset state of visible records on component & settings change
          key={[fiber.id, groupByParent, showUnmounted, showSubtreeEvents].join(
            "-"
          )}
          rootId={fiber.id}
          events={events}
          showTimings={showTimings}
        />
      </div>
    </FiberInfoSection>
  );
}
