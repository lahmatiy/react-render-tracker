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

  type MethodsMap = {
    [method: string]: (...args: any[]) => any;
  };
  type NamespaceDef = {
    data: any;
    methods: MethodsMap;
  };
  type NamespacesMap = {
    [ns: string]: NamespaceDef;
  };

  type TreeEventsState = { count: number };
  type OpenSourceSettings = {
    pattern: string;
    projectRoot: string;
    basedir: string;
    basedirJsx: string;
  } | null;
  interface RRTNamespaces extends NamespacesMap {
    "*": {
      data: never;
      methods: {
        "open-file"(filepath: string): void;
        "resolve-source-locations"(
          locations: string[]
        ): Array<{ loc: string; resolved: string }>;
      };
    };
    "tree-changes": {
      data: TreeEventsState;
      methods: {
        getEvents(offset: number, count: number): Message[];
        getEventsState(): TreeEventsState;
      };
    };
    "open-source-settings": {
      data: OpenSourceSettings;
      methods: never;
    };
  }

  type PublisherNS<NS extends NamespaceDef> = {
    publish(data: NS["data"]): void;
    provide<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T,
      fn: (...args: Parameters<M>) => Promise<ReturnType<M>> | ReturnType<M>
    ): void;
  };
  type SubscriberNS<NS extends NamespaceDef> = {
    subscribe(callback: (data: NS["data"] | null) => void): void;
    callRemote<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T,
      ...args: Parameters<M>
    ): Promise<ReturnType<M>>;
    onRemoteMethodsChanged<T extends keyof NS["methods"]>(
      callback: (methods: T[]) => void
    ): () => void;
    getRemoteMethod<T extends keyof NS["methods"], M extends NS["methods"][T]>(
      method: T
    ): ((...args: Parameters<M>) => Promise<ReturnType<M>>) & {
      available: boolean;
    };
  };

  export type Publisher = {
    id: string;
    ns<T extends keyof RRTNamespaces>(
      channel: T
    ): PublisherNS<RRTNamespaces[T]>;
  } & PublisherNS<RRTNamespaces["*"]>;

  export type Subscriber = {
    connected: ReactiveValue<boolean>;
    ns<T extends keyof RRTNamespaces>(
      channel: T
    ): SubscriberNS<RRTNamespaces[T]>;
  } & SubscriberNS<RRTNamespaces["*"]>;
}
