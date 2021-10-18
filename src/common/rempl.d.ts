declare module "rempl" {
  import { Message } from "common-types";

  export function createPublisher(
    name: string,
    requestUI: (
      settings: any,
      callback: (error: Error | null, type: string, value: string) => void
    ) => void
  ): Publisher;
  export function getSubscriber(): Subscriber;
  export function getHost(): {
    activate(): void;
  };

  type PublisherChannels = "tree-changes" | "open-source-settings";
  type TreeChangesData = { count: number };
  type TreeChangesGetEventsMethod = (
    offset: number,
    count: number,
    callback: (events: Message[]) => void
  ) => void;
  type TreeChangesNsMethods = "getEvents";
  type TreeChangesNsRet<T> = T extends "getEvents"
    ? TreeChangesGetEventsMethod
    : never;
  type OpenSourceSettings = {
    pattern: string;
    root: string;
    base: string;
  } | null;
  type OpenSourceSettingsNsMethods = never;
  type OpenSourceSettingsNsRet = never;
  type PublisherNS<dataT, methodsEnum, methodsRet> = {
    publish(data: dataT): void;
    provide<T extends methodsEnum>(method: T, fn: methodsRet): void;
  };
  type SubscriberNS<dataT, methodsEnum, methodsRet> = {
    subscribe(callback: (data: dataT | null) => void): void;
    onRemoteMethodsChanged(callback: (methods: string[]) => void): void;
    getRemoteMethod<T extends methodsEnum>(
      method: T
    ): methodsRet & { available: boolean };
  };

  type PublisherMethods = "open-file" | "resolve-source-locations";
  type PublisherMethod<T extends PublisherMethods> = T extends "open-file"
    ? (filepath: string) => void
    : T extends "resolve-source-locations"
    ? (
        locations: string[],
        callback: (result: Array<{ loc: string; resolved: string }>) => void
      ) => void
    : never;

  export interface Publisher {
    provide<T extends PublisherMethods>(
      name: T,
      callback: PublisherMethod<T>
    ): void;
    ns<T extends PublisherChannels>(
      channel: T
    ): T extends "tree-changes"
      ? PublisherNS<
          TreeChangesData,
          TreeChangesNsMethods,
          TreeChangesNsRet<TreeChangesNsMethods>
        >
      : T extends "open-source-settings"
      ? PublisherNS<
          OpenSourceSettings,
          OpenSourceSettingsNsMethods,
          OpenSourceSettingsNsRet
        >
      : never;
  }

  export interface Subscriber {
    onRemoteMethodsChanged(callback: (methods: string[]) => void): void;
    callRemote<T extends PublisherMethods>(
      name: T,
      ...args:
        | Parameters<PublisherMethod<T>>
        | [
            ...Parameters<PublisherMethod<T>>,
            (value: ReturnType<PublisherMethod<T>>) => void
          ]
    ): void;
    ns<T extends PublisherChannels>(
      channel: T
    ): T extends "tree-changes"
      ? SubscriberNS<
          TreeChangesData,
          TreeChangesNsMethods,
          TreeChangesNsRet<TreeChangesNsMethods>
        >
      : T extends "open-source-settings"
      ? SubscriberNS<
          OpenSourceSettings,
          OpenSourceSettingsNsMethods,
          OpenSourceSettingsNsRet
        >
      : never;
  }
}
