import _rempl from "rempl";

declare global {
  const rempl: typeof _rempl;
}

export const remoteSubscriber = rempl.getSubscriber();
