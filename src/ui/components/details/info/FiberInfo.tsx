import * as React from "react";
import { ElementTypeProvider } from "../../../../common/constants";
import { FiberInfoSection } from "./FiberInfoSection";
import { FiberInfoSectionContexts } from "./FiberInfoSectionContexts";
import { FiberInfoSectionConsumers } from "./FiberInfoSectionConsumers";
import { FiberInfoSectionMemoHooks } from "./FiberInfoSectionMemoHooks";
import { FiberInfoSectionProps } from "./FiberInfoSectionProps";
import { MessageFiber } from "../../../types";
import { FiberInfoSectionEvents } from "./FiberInfoSectionEvents";

interface IFiberInfo {
  fiber: MessageFiber;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}
interface SectionStateContext {
  toggle(name: string): void;
  get(name: string): boolean;
}

const SectionStateContext = React.createContext<SectionStateContext>({} as any);
export const useSectionStateContext = () =>
  React.useContext(SectionStateContext);

const FiberInfo = ({
  fiber,
  groupByParent,
  showUnmounted,
  showTimings,
}: IFiberInfo) => {
  const [sectionStates, setSectionStates] = React.useState<
    Record<string, boolean>
  >({ events: true });
  const sectionStatesContextValue = React.useMemo<SectionStateContext>(() => {
    return {
      get(name) {
        return sectionStates[name] || false;
      },
      toggle(name) {
        setSectionStates({ ...sectionStates, [name]: !sectionStates[name] });
      },
    };
  }, [sectionStates]);

  return (
    <div className="fiber-info">
      <SectionStateContext.Provider value={sectionStatesContextValue}>
        <FiberInfoSectionProps fiber={fiber} />
        {false && (
          <FiberInfoSection id="timings" header="Timing"></FiberInfoSection>
        )}
        {fiber.typeDef.contexts && <FiberInfoSectionContexts fiber={fiber} />}
        {fiber.type === ElementTypeProvider && (
          <FiberInfoSectionConsumers fiber={fiber} />
        )}
        <FiberInfoSectionMemoHooks fiber={fiber} />
        <FiberInfoSectionEvents
          fiber={fiber}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
          showTimings={showTimings}
        />
      </SectionStateContext.Provider>
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
