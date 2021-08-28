import rempl from "rempl";
import debounce from "lodash.debounce";
import { RecordEventHandler, Message } from "./types";

let eventIdSeed = 0;
const events: Message[] = [];
const getTimestamp =
  typeof performance === "object" &&
  typeof performance.now === "function" &&
  typeof performance.timeOrigin === "number"
    ? () => performance.timeOrigin + performance.now()
    : () => Date.now();

declare let __DEV__: boolean;
declare let __SUBSCRIBER_SRC__: string;

export const publisher = rempl.createPublisher(
  "react-render-tracker",
  (settings, callback) => {
    if (__DEV__) {
      const { origin } = new URL(import.meta.url);

      fetch(`${origin}/subscriber.js?xxx`)
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
  events.push({
    id: eventIdSeed++,
    timestamp: getTimestamp(),
    ...payload,
  });

  publishEventsDebounced();
};
