import { createPublisher } from "rempl";
import debounce from "lodash.debounce";
import { ToolId } from "../common/constants";
import config from "./config";
import { resolveSourceLoc } from "./utils/resolveSourceLoc";
import { getRendererInfo } from "./utils/renderer-info";
import {
  ReactInternals,
  ReactRendererInfo,
  ReactUnsupportedRendererInfo,
  RecordEventHandler,
  Message,
} from "./types";
import { hook } from "./index";
import Overlay from "./overlay";

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

const reactRenderers: ReactRendererInfo[] = [];
const reactUnsupportedRenderers: ReactUnsupportedRendererInfo[] = [];
const reactRenderersChannel = publisher.ns("react-renderers");

reactRenderersChannel.publish(getReactRenderersData());

function getReactRenderersData() {
  return {
    renderers: reactRenderers,
    unsupportedRenderers: reactUnsupportedRenderers,
  };
}

export function publishReactUnsupportedRenderer(
  rendererInfo: ReactUnsupportedRendererInfo
) {
  reactUnsupportedRenderers.push(rendererInfo);
  reactRenderersChannel.publish(getReactRenderersData());
}

export function publishReactRenderer(id: number, renderer: ReactInternals) {
  const channelId = `events:${id}` as `events:${number}`;

  reactRenderers.push({
    id,
    ...getRendererInfo(renderer),
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

  reactRenderersChannel.publish(getReactRenderersData());
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

const HIGHLIGHTER_NS = "highlighter";
let overlay: Overlay | null = null;

publisher.ns(HIGHLIGHTER_NS).provide("highlight", (fiberId, name: string) => {
  let nodes = hook.rendererInterfaces.get(1).findNativeNodesForFiberID(fiberId)
  if (!nodes || !nodes.length) {
    return;
  }

  nodes = nodes.filter(node => node.nodeType === 1);

  if (nodes.length) {

    if (!overlay) {
      overlay = new Overlay();
    }

    overlay.inspect(nodes, name);
  }
});

publisher.ns(HIGHLIGHTER_NS).provide("removeHighlight", (fiberId) => {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
});

publisher.ns(HIGHLIGHTER_NS).provide("startInspect", () => {
  startInspect();
});

publisher.ns(HIGHLIGHTER_NS).provide("stopInspect", () => {
  stopInspect();
});

function startInspect() {
  window.addEventListener('click', onClick, true);
  window.addEventListener('mousedown', onMouseEvent, true);
  window.addEventListener('mouseover', onMouseEvent, true);
  window.addEventListener('mouseup', onMouseEvent, true);
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointerover', onPointerOver, true);
  window.addEventListener('pointerup', onPointerUp, true);
}

function stopInspect() {
  window.removeEventListener('click', onClick, true);
  window.removeEventListener('mousedown', onMouseEvent, true);
  window.removeEventListener('mouseover', onMouseEvent, true);
  window.removeEventListener('mouseup', onMouseEvent, true);
  window.removeEventListener('pointerdown', onPointerDown, true);
  window.removeEventListener('pointerover', onPointerOver, true);
  window.removeEventListener('pointerup', onPointerUp, true);
}

function onClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function onMouseEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function onPointerDown(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  // selectFiberForNode(((event.target: any): HTMLElement));
}

function onPointerOver(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.target;

  if (!overlay) {
    overlay = new Overlay();
  }

  if (target) {
    overlay.inspect([target], "FOO");

    selectFiberForNode(target);
  }
}

function onPointerUp(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

const selectFiberForNode = (node) => {
  const fiberID = hook.rendererInterfaces.get(1).getFiberIDForNative(node, true);

  if (fiberID) {
    publisher.ns(HIGHLIGHTER_NS).publish({ fiberID });
  }
}

// import { connectPublisherWs } from "rempl";
// connectPublisherWs("http://localhost:8177/");
