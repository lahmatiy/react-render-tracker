import { Message } from "./types";

declare module "rempl/*" {
  export function getSubscriber(): Subscriber;

  export interface Subscriber {
    ns<T extends string>(
      channel: T
    ): T extends "tree-changes"
      ? {
          subscribe(data: { count: number }): void;
          getRemoteMethod<T extends string>(
            method: T
          ): T extends "getEvents"
            ? (
                offset: number,
                count: number,
                callback: (events: Message[]) => void
              ) => void
            : never;
        }
      : never;
  }
}
