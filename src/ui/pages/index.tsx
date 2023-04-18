import { ComponentsTreePage } from "./ComponentsTree";
import { MaybeLeaksPage } from "./MaybeLeaks";

export type AppPageId = typeof AppPageComponentTree | typeof AppPageMaybeLeaks;
export type AppPage = {
  id: AppPageId;
  title: string;
  content: () => JSX.Element;
};

export const AppPageComponentTree = "component-tree";
export const AppPageMaybeLeaks = "maybe-leaks";
export const pages: Record<AppPageId, AppPage> = {
  [AppPageComponentTree]: {
    id: AppPageComponentTree,
    title: "Component tree",
    content: ComponentsTreePage,
  },
  [AppPageMaybeLeaks]: {
    id: AppPageMaybeLeaks,
    title: "Memory leaks",
    content: MaybeLeaksPage,
  },
};
