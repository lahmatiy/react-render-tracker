import * as React from "react";
import { useFiberMaps } from "../../../utils/fiber-maps";
import { ElementTypeProvider } from "../../../../common/constants";
import { FiberInfoHeader } from "./FiberInfoHeader";
import { FiberInfoSection } from "./FiberInfoSection";
import { FiberInfoSectionContexts } from "./FiberInfoSectionContexts";
import { FiberInfoSectionConsumers } from "./FiberInfoSectionConsumers";
import { FiberInfoSectionMemoHooks } from "./FiberInfoSectionMemoHooks";
import { FiberInfoSectionProps } from "./FiberInfoSectionProps";

interface IFiberInfo {
  fiberId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}
interface SectionStateContext {
  toggle(name: string): void;
  get(name: string): boolean;
}

const SectionStateContext = React.createContext<SectionStateContext>({} as any);
export const useSectionStateContext = () =>
  React.useContext(SectionStateContext);

const FiberInfo = ({ fiberId, groupByParent, showUnmounted }: IFiberInfo) => {
  const [sectionStates, setSectionStates] = React.useState<
    Record<string, boolean>
  >({});
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);
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

  if (fiber === undefined) {
    return <div className="fiber-info">Fiber with #{fiberId} is not found</div>;
  }

  return (
    <div className="fiber-info">
      <FiberInfoHeader
        fiber={fiber}
        groupByParent={groupByParent}
        showUnmounted={showUnmounted}
      />

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
      </SectionStateContext.Provider>
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
