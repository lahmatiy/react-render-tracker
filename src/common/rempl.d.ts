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

  type treeChangesData = { count: number };
  type treeChangesGetEventsMethod = (
    offset: number,
    count: number,
    callback: (events: Message[]) => void
  ) => void;

  export interface Publisher {
    ns<T extends string>(
      channel: T
    ): T extends "tree-changes"
      ? {
          publish(data: treeChangesData): void;
          provide<T extends string>(
            method: T,
            fn: T extends "getEvents" ? treeChangesGetEventsMethod : never
          ): void;
        }
      : never;
  }

  export interface Subscriber {
    ns<T extends string>(
      channel: T
    ): T extends "tree-changes"
      ? {
          subscribe(callback: (data: treeChangesData | null) => void): void;
          onRemoteMethodsChanged(callback: (methods: string[]) => void): void;
          getRemoteMethod<T extends string>(
            method: T
          ): T extends "getEvents"
            ? treeChangesGetEventsMethod & {
                available: boolean;
              }
            : never;
        }
      : never;
  }
}
