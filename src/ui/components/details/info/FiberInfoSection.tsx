import * as React from "react";

interface IFiberInfoSection {
  header: string;
  emptyText?: string;
  children?: JSX.Element | JSX.Element[] | string | null;
}

export function FiberInfoSection({
  header,
  emptyText,
  children,
}: IFiberInfoSection) {
  return (
    <div className="fiber-info-section">
      <div className="fiber-info-section__header">
        {header}
        {!children ? (
          <span className="fiber-info-section__header-no-data">
            {emptyText || "no data"}
          </span>
        ) : (
          ""
        )}
      </div>
      {children}
    </div>
  );
}
