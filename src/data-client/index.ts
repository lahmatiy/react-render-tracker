import { getSelfSubscriber, Subscriber } from "rempl";
import { Message } from "common-types";
import { ToolId } from "../common/constants";

const subscriber = getSelfSubscriber(ToolId) as Subscriber;
const getEventsMethod = subscriber
  .ns("tree-changes")
  .getRemoteMethod("getEvents");
const getEventsStateMethod = subscriber
  .ns("tree-changes")
  .getRemoteMethod("getEventsState");

const cachedEvents: Message[] = [];
const newEventListeners: (() => void)[] & { subscribed?: boolean } = [];
let totalEventsCount = 0;
let syncing = false;

async function syncEvents() {
  if (syncing) {
    return;
  }

  try {
    let hasNewEvents = false;

    syncing = true;

    while (cachedEvents.length < totalEventsCount) {
      if (!getEventsMethod.available) {
        break;
      }

      const chunk = await getEventsMethod(cachedEvents.length, 1000);
      cachedEvents.push(...chunk);

      if (!chunk.length) {
        break;
      }

      hasNewEvents = true;
    }

    if (hasNewEvents) {
      for (const listener of newEventListeners) {
        listener();
      }
    }
  } finally {
    syncing = false;
  }
}

export async function getEvents(offset = 0, limit = Infinity) {
  await getEventCount();
  await syncEvents();

  return cachedEvents.slice(offset, offset + limit);
}

export function subscribeNewEvents(
  callback: (newEvents: Message[]) => void,
  offset = cachedEvents.length
) {
  const callbackWrapper = () => {
    try {
      callback(cachedEvents.slice(offset));
      offset = cachedEvents.length;
    } catch {}
  };

  newEventListeners.push(callbackWrapper);

  if (offset < cachedEvents.length) {
    callback(cachedEvents.slice(offset));
  }

  offset = cachedEvents.length;

  if (!newEventListeners.subscribed) {
    subscriber.ns("tree-changes").subscribe(state => {
      totalEventsCount = Math.max(totalEventsCount, state?.count || 0);
      syncEvents();
    });
    newEventListeners.subscribed = true;
  }

  return () => {
    const idx = newEventListeners.indexOf(callbackWrapper);
    if (idx !== -1) {
      newEventListeners.splice(idx, 1);
    }
  };
}

export async function getEventCount() {
  if (!getEventsStateMethod.available) {
    return 0;
  }

  totalEventsCount = (await getEventsStateMethod())?.count || 0;

  return totalEventsCount;
}

export function isConnected() {
  return subscriber.connected.value;
}
export function subscribeConnected(fn: (value: boolean) => void) {
  subscriber.connected.link(fn);
  return () => subscriber.connected.off(fn);
}
export function isReady() {
  return new Promise<void>(resolve => {
    let methods: string[] = [];
    let connected = subscriber.connected.value;
    const check = () => {
      if (connected && methods.includes("getEvents")) {
        subscriber.connected.off(onConnected);
        unsubscribeRemoteMethodsChanged();
        resolve();
      }
    };

    const onConnected = (newConnected: boolean) => {
      connected = newConnected;
      check();
    };
    subscriber.connected.on(onConnected);
    const unsubscribeRemoteMethodsChanged = subscriber
      .ns("tree-changes")
      .onRemoteMethodsChanged(newMethods => {
        methods = newMethods;
        check();
      });

    check();
  });
}
