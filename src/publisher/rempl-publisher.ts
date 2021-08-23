import rempl from "rempl";
import debounce from "lodash.debounce";
import { Publisher, RecordEventHandler, Message } from "./types";

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
export const publisher: Publisher = rempl.createPublisher(
  "react-render-tracker",
  (
    settings: any,
    callback: (error: Error, type: string, value: string) => void
  ) => {
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

const publishEventsDebounced = debounce(
  () => publisher.ns("tree-changes").publish(events),
  50,
  { maxWait: 100 }
);
export const recordEvent: RecordEventHandler = payload => {
  events.push({
    id: eventIdSeed++,
    timestamp: getTimestamp(),
    ...payload,
  });

  publishEventsDebounced();
};
