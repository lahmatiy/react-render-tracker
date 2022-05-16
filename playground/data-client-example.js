// import * as rrt from "react-render-tracker/data-client";
import * as rrt from "./rrt-data-client.js";

function filterCommits(events) {
  return events.filter(({ op }) => op === "commit-start");
}

rrt.isReady().then(() => {
  setTimeout(async () => {
    const initialEvents = await rrt.getEvents();
    console.log("[data-client-example] Skip initial events:", initialEvents);
    console.log(
      "[data-client-example] Initial commits:",
      filterCommits(initialEvents)
    );

    rrt.subscribeNewEvents(newEvents => {
      console.log("[data-client-example] New events", newEvents);
      console.log(
        "[data-client-example] Commits in new events",
        filterCommits(newEvents)
      );
    });
  }, 350);
});
