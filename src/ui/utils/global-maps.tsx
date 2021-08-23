import React from "react";
import { useEffect } from "react";
import { MessageElement } from "../types";
import { notifyById, subscribeById } from "./subscription";

interface GlobalMapsContext {
  componentById: SubscribeMap<number, MessageElement>;
  componentsByParentId: SubscribeMap<number, number[]>;
  componentsByOwnerId: SubscribeMap<number, number[]>;
}

const GlobalMapsContext = React.createContext<GlobalMapsContext>({} as any);
export const useGlobalMaps = () => React.useContext(GlobalMapsContext);
export function GlobalMapsContextProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const value: GlobalMapsContext = {
    componentById: new SubscribeMap(),
    componentsByParentId: new SubscribeMap(),
    componentsByOwnerId: new SubscribeMap(),
  };

  return (
    <GlobalMapsContext.Provider value={value}>
      {children}
    </GlobalMapsContext.Provider>
  );
}

type callback<V> = (value: V) => void;
export class SubscribeMap<K, V> extends Map<K, V> {
  private subscriptionsMap = new Map<K, Set<callback<V>>>();

  subscribe(id: K, fn: callback<V>) {
    return subscribeById<K, callback<V>>(this.subscriptionsMap, id, fn);
  }

  notify(id: K) {
    return notifyById(this.subscriptionsMap, id, this.get(id));
  }
}

export const useComponent = (componentId: number) => {
  const { componentById } = useGlobalMaps();
  const [, triggerUpdate] = React.useState<MessageElement>();

  useEffect(
    () => componentById.subscribe(componentId, triggerUpdate),
    [componentId]
  );

  return componentById.get(componentId);
};

export const useComponentChildren = (
  componentId: number,
  groupByParent = false
) => {
  const { componentsByOwnerId, componentsByParentId } = useGlobalMaps();
  const map = groupByParent ? componentsByParentId : componentsByOwnerId;
  const [, triggerUpdate] = React.useState<number[]>();

  useEffect(
    () => map.subscribe(componentId, triggerUpdate),
    [componentId, map]
  );

  return map.get(componentId) || [];
};
