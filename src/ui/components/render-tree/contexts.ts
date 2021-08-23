import * as React from "react";

export interface ViewSettings {
  groupByParent: boolean;
  showUnmounted: boolean;
}
export const ViewSettingsContext = React.createContext<ViewSettings>({
  groupByParent: false,
  showUnmounted: true,
});
export const useViewSettingsContext = () =>
  React.useContext(ViewSettingsContext);
