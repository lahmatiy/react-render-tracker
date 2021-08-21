import rempl from "rempl";
import { Publisher, RecordEventHandler, Message } from "./types";

let eventIdSeed = 0;
const events: Message[] = [];
const getTimestamp =
  typeof performance === "object" &&
  typeof performance.now === "function" &&
  typeof performance.timeOrigin === "number"
    ? () => performance.timeOrigin + performance.now()
    : () => Date.now();

export const publisher: Publisher = rempl.createPublisher(
  "react-render-tracker",
  (
    settings: any,
    callback: (error: Error, type: string, value: string) => void
  ) => {
    const { origin } = new URL(import.meta.url);

    fetch(`${origin}/subscriber.js`)
      .then(res => res.text())
      .then(script => callback(null, "script", script));
  }
);

export const recordEvent: RecordEventHandler = payload => {
  events.push({
    id: eventIdSeed++,
    timestamp: getTimestamp(),
    ...payload,
  });
  publisher.ns("tree-changes").publish(events);
};
