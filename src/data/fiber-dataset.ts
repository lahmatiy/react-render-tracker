import { Message } from "common-types";
import {
  Commit,
  FiberTypeDef,
  LinkedEvent,
  MessageFiber,
} from "../common/consumer-types";
import { processEvents } from "./process-events";
import { SubscribeMap, SubsetSplit } from "./subscription";
import { Tree } from "./tree";

export function createFiberDataset(events: Message[] = []) {
  const allEvents: Message[] = [];
  const linkedEvents = new WeakMap<Message, LinkedEvent>();
  const commitById = new SubscribeMap<number, Commit>();
  const fiberById = new SubscribeMap<number, MessageFiber>();
  const fiberTypeDefById = new SubscribeMap<number, FiberTypeDef>();
  const fibersByTypeId = new SubsetSplit<number, number>();
  const fibersByProviderId = new SubsetSplit<number, number>();
  const parentTree = new Tree();
  const parentTreeIncludeUnmounted = new Tree();
  const ownerTree = new Tree();
  const ownerTreeIncludeUnmounted = new Tree();

  const dataset = {
    allEvents,
    linkedEvents,
    commitById,
    fiberById,
    fiberTypeDefById,
    fibersByTypeId,
    fibersByProviderId,
    parentTree,
    parentTreeIncludeUnmounted,
    ownerTree,
    ownerTreeIncludeUnmounted,
    appendEvents(events: Message[]) {
      processEvents(events, allEvents, dataset);
    },
    selectTree(groupByParent: boolean, includeUnmounted: boolean): Tree {
      return groupByParent
        ? includeUnmounted
          ? parentTreeIncludeUnmounted
          : parentTree
        : includeUnmounted
        ? ownerTreeIncludeUnmounted
        : ownerTree;
    },
  };

  if (Array.isArray(events) && events.length > 0) {
    dataset.appendEvents(events);
  }

  return dataset;
}
