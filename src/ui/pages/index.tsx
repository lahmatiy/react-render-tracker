import { CommitsPage, CommitsPageBadge } from "./Commits";
import { FeatureCommits, FeatureMemLeaks } from "../../common/constants";
import { ComponentsTreePage } from "./ComponentsTree";
import { MaybeLeaksPage, MaybeLeaksPageBadge } from "./MaybeLeaks";

export const enum AppPage {
  ComponentTree = "component-tree",
  Commits = "commits",
  MaybeLeaks = "maybe-leaks",
}

export type AppPageConfig = {
  id: AppPage;
  title: string;
  disabled?: boolean;
  content: React.FunctionComponent;
  badge?: React.FunctionComponent;
};

export const pages: Record<AppPage, AppPageConfig> = {
  [AppPage.ComponentTree]: {
    id: AppPage.ComponentTree,
    title: "Component tree",
    content: ComponentsTreePage,
  },
  [AppPage.Commits]: {
    id: AppPage.Commits,
    title: "Commits",
    disabled: !FeatureCommits,
    content: CommitsPage,
    badge: CommitsPageBadge,
  },
  [AppPage.MaybeLeaks]: {
    id: AppPage.MaybeLeaks,
    title: "Memory leaks",
    disabled: !FeatureMemLeaks,
    content: MaybeLeaksPage,
    badge: MaybeLeaksPageBadge,
  },
};
