import * as React from "react";

export interface TreeViewSettings {
  setFiberElement: (id: number, element: HTMLElement | null) => void;
  getFiberElement: (id: number) => HTMLElement | null;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}
export const TreeViewSettingsContext = React.createContext<TreeViewSettings>({
  setFiberElement: () => undefined,
  getFiberElement: () => null,
  groupByParent: false,
  showUnmounted: true,
  showTimings: false,
});
export const useTreeViewSettingsContext = () =>
  React.useContext(TreeViewSettingsContext);
