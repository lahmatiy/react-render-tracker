import * as React from "react";
import { useSectionStateContext } from "./FiberInfo";

interface IFiberInfoSection {
  id: string;
  header: string;
  emptyText?: string;
  children?: JSX.Element | JSX.Element[] | string | null;
}

export function FiberInfoSection({
  id,
  header,
  emptyText,
  children,
}: IFiberInfoSection) {
  const { get: getSectionState, toggle: toggleSectionState } =
    useSectionStateContext();
  const expanded = getSectionState(id);

  return (
    <div className="fiber-info-section">
      <div
        className={
          "fiber-info-section__header" +
          (!children ? " fiber-info-section__header_no-data" : "") +
          (expanded ? " fiber-info-section__header_expanded" : "")
        }
        onClick={() => toggleSectionState(id)}
      >
        {header}
        {!children ? (
          <span className="fiber-info-section__header-no-data">
            {emptyText || "no data"}
          </span>
        ) : (
          ""
        )}
      </div>
      {expanded && children}
    </div>
  );
}
