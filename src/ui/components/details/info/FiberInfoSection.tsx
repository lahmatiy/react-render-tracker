import * as React from "react";
import { useSectionStateContext } from "./FiberInfo";

interface IFiberInfoSection {
  id: string;
  header: string;
  emptyText?: string;
  expandedOpts?: JSX.Element | JSX.Element[] | string | null;
  children?: JSX.Element | JSX.Element[] | string | null;
}

export function FiberInfoSection({
  id,
  header,
  emptyText,
  expandedOpts,
  children,
}: IFiberInfoSection) {
  const { get: getSectionState, toggle: toggleSectionState } =
    useSectionStateContext();
  const expanded = getSectionState(id) && Boolean(children);

  return (
    <div
      className={
        "fiber-info-section" +
        (!children ? " fiber-info-section_no-data" : "") +
        (expanded ? " fiber-info-section_expanded" : "")
      }
    >
      <div
        className="fiber-info-section__header"
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
        {expanded ? expandedOpts : null}
      </div>
      {expanded && children}
    </div>
  );
}
