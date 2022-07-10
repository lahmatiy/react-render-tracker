import { createPublisher } from "rempl";
import debounce from "lodash.debounce";
import { ReactRenderer } from "common-types";
import { RecordEventHandler, Message, ReactInternals } from "./types";
import { ToolId } from "../common/constants";
import config from "./config";
import { resolveSourceLoc } from "./utils/resolveSourceLoc";
import { getRendererInfo } from "./utils/renderer-info";

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

export const publisher = createPublisher(ToolId, () => {
  if (__DEV__) {
    // const { origin } = new URL(import.meta.url);
    const origin = "http://localhost:3000";

    return fetch(`${origin}/subscriber.js`)
      .then(res => res.text())
      .then(script => ({ type: "script", value: script }));
  } else {
    return { type: "script", value: __SUBSCRIBER_SRC__ };
  }
});

const reactInstances: ReactRenderer[] = [];
const reactInstancesChannel = publisher.ns("react-renderers");

reactInstancesChannel.publish([]);

export function publishReactInstance(id: number, renderer: ReactInternals) {
  const channelId = `events:${id}` as `events:${number}`;

  reactInstances.push({
    ...getRendererInfo(id, renderer),
    channelId,
  });

  const eventLogChannel = publisher.ns(channelId);
  const getEventsState = () => ({
    count: events.length,
  });
  const publishEventsDebounced = debounce(
    () => eventLogChannel.publish(getEventsState()),
    50,
    { maxWait: 50 }
  );
  const recordEvent: RecordEventHandler = payload => {
    const id = eventIdSeed++;

    events.push({
      id,
      // timestamp: Math.trunc(getTimestamp()),
      ...payload,
    });

    publishEventsDebounced();

    return id;
  };

  reactInstancesChannel.publish(reactInstances);
  eventLogChannel.publish(getEventsState());
  eventLogChannel.provide({
    getEventsState() {
      publishEventsDebounced.flush();

      return getEventsState();
    },
    getEvents(offset, count) {
      if (isNaN(offset) || isNaN(count)) {
        return [];
      }

      publishEventsDebounced.flush();

      const start = Math.max(0, Math.floor(offset));
      let end =
        start + Math.min(Math.max(0, Math.floor(count)), events.length - start);

      if (end > start) {
        const { commitId } = events[end - 1];
        for (; end < events.length; end++) {
          if (events[end].commitId !== commitId) {
            break;
          }
        }
      }

      return events.slice(start, end);
    },
  });

  return recordEvent;
}

publisher.ns("open-source-settings").publish(openSourceLoc || null);
publisher.provide("resolve-source-locations", locations =>
  Promise.all(locations.map(resolveSourceLoc)).then(result =>
    result.map((resolved, idx) => ({ loc: locations[idx], resolved }))
  )
);

// import { connectPublisherWs } from "rempl";
// connectPublisherWs("http://localhost:8177/");
