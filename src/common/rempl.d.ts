declare module "rempl" {
  import { Message, ReactRenderer } from "common-types";

  export function createPublisher(
    name: string,
    requestUI: (
      settings: any,
      callback: (error: Error | null, type: string, value: string) => void
    ) => void
  ): Publisher;
  export function connectPublisherWs(uri?: string): void;
  export function getSubscriber(): Subscriber;
  export function getSelfSubscriber(id: string): Subscriber;
  export function getHost(): {
    activate(): void;
  };

  export type ReactiveValue<T> = {
    value: T;
    link(fn: (value: T) => void): void;
    on(fn: (value: T) => void): void;
    off(fn: (value: T) => void): void;
  };

  type Method = (...args: any[]) => any;
  type MethodsMap = {
    [method: string]: Method;
  };
  type NamespaceDef = {
    data: any;
    methods: MethodsMap;
  };
  type NamespacesMap = {
    [ns: string]: NamespaceDef;
  };
  type DefinedNamespaceMap<TSource extends NamespacesMap> = {
    [K in keyof TSource]: TSource[K];
  };

  type TreeEventsState = { count: number };
  type OpenSourceSettings = {
    pattern: string;
    projectRoot: string;
    basedir: string;
    basedirJsx: string;
  } | null;
  export type RemoteProtocol = DefinedNamespaceMap<{
    "*": {
      data: never;
      methods: {
        "open-file"(filepath: string): void;
        "resolve-source-locations"(
          locations: string[]
        ): Array<{ loc: string; resolved: string }>;
      };
    };
    "react-renderers": {
      data: ReactRenderer[];
      methods: never;
    };
    [key: `events:${number}`]: {
      data: TreeEventsState | null;
      methods: {
        getEvents(offset: number, count: number): Message[];
        getEventsState(): TreeEventsState;
      };
    };
    "open-source-settings": {
      data: OpenSourceSettings;
      methods: never;
    };
  }>;

  type PublisherNS<NS extends NamespaceDef> = {
    publish(data: NS["data"]): void;
    provide<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T,
      fn: (...args: Parameters<M>) => Promise<ReturnType<M>> | ReturnType<M>
    ): void;
    provide(methods: Partial<NS["methods"]>): void;
  };

  export type SubscriberRemoveMethod<M extends Method> = ((
    ...args: Parameters<M>
  ) => Promise<ReturnType<M>>) & {
    available: boolean;
  };
  export type SubscriberNS<NS extends NamespaceDef> = {
    subscribe(callback: (data: NS["data"]) => void): void;
    callRemote<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T,
      ...args: Parameters<M>
    ): Promise<ReturnType<M>>;
    onRemoteMethodsChanged<T extends keyof NS["methods"]>(
      callback: (methods: T[]) => void
    ): () => void;
    getRemoteMethod<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T
    ): SubscriberRemoveMethod<M>;
  };

  export type Publisher = {
    id: string;
    ns<T extends keyof RemoteProtocol>(
      channel: T
    ): PublisherNS<RemoteProtocol[T]>;
  } & PublisherNS<RemoteProtocol["*"]>;

  export type Subscriber = {
    connected: ReactiveValue<boolean>;
    ns<T extends keyof RemoteProtocol>(
      channel: T
    ): SubscriberNS<RemoteProtocol[T]>;
  } & SubscriberNS<RemoteProtocol["*"]>;
}
