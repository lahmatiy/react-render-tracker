import * as React from "react";

export interface ViewSettings {
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}
export const ViewSettingsContext = React.createContext<ViewSettings>({
  groupByParent: false,
  showUnmounted: true,
  showTimings: false,
});
export const useViewSettingsContext = () =>
  React.useContext(ViewSettingsContext);
