import * as React from "react";

export interface TreeViewSettings {
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}
export const TreeViewSettingsContext = React.createContext<TreeViewSettings>({
  groupByParent: false,
  showUnmounted: true,
  showTimings: false,
});
export const useTreeViewSettingsContext = () =>
  React.useContext(TreeViewSettingsContext);
