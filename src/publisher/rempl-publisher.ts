import rempl from "rempl";
import debounce from "lodash.debounce";
import { RecordEventHandler, Message } from "./types";
import config from "./config";
import { resolveSourceLoc } from "./utils/resolveSourceLoc";

let eventIdSeed = 0;
const { openSourceLoc } = config;
const events: Message[] = [];
// const getTimestamp =
//   typeof performance === "object" &&
//   typeof performance.now === "function" &&
//   typeof performance.timeOrigin === "number"
//     ? () => performance.timeOrigin + performance.now()
//     : () => Date.now();

declare let __DEV__: boolean;
declare let __SUBSCRIBER_SRC__: string;

export const publisher = rempl.createPublisher(
  "React Render Tracker",
  (settings, callback) => {
    if (__DEV__) {
      const { origin } = new URL(import.meta.url);

      fetch(`${origin}/subscriber.js`)
        .then(res => res.text())
        .then(script => callback(null, "script", script));
    } else {
      callback(null, "script", __SUBSCRIBER_SRC__);
    }
  }
);

const eventLogChannel = publisher.ns("tree-changes");
eventLogChannel.provide("getEvents", (offset, count, callback) => {
  if (isNaN(offset) || isNaN(count)) {
    return callback([]);
  }

  offset = Math.max(0, Math.floor(offset));
  count = Math.min(Math.max(0, Math.floor(count)), events.length - offset);

  callback(events.slice(offset, offset + count));
});
const publishEventsDebounced = debounce(
  () =>
    eventLogChannel.publish({
      count: events.length,
    }),
  50,
  { maxWait: 50 }
);
export const recordEvent: RecordEventHandler = payload => {
  const id = eventIdSeed++;

  events.push({
    id,
    // timestamp: Math.trunc(getTimestamp()),
    ...payload,
  });

  publishEventsDebounced();

  return id;
};

publisher.ns("open-source-settings").publish(openSourceLoc || null);

publisher.provide("resolve-source-locations", (locations, callback) => {
  Promise.all(locations.map(resolveSourceLoc)).then(result =>
    callback(result.map((resolved, idx) => ({ loc: locations[idx], resolved })))
  );
});
