import * as React from "react";
import { AppPage } from "../pages";

interface PageState {
  currentPage: AppPage;
  openPage(page: AppPage): void;
}

const PageContext = React.createContext<PageState>({} as any);
export const usePageContext = () => React.useContext(PageContext);
export const PageContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [page, setPage] = React.useState<AppPage>(AppPage.ComponentTree);
  const value = React.useMemo(
    () => ({
      currentPage: page,
      openPage: (page: AppPage) => setPage(page),
    }),
    [page]
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
