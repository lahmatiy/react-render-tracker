import * as React from "react";
import { useFiberMaps } from "../../../utils/fiber-maps";
import { ElementTypeProvider } from "../../../../common/constants";
import { FiberInfoHeader } from "./FiberInfoHeader";
import { FiberInfoSection } from "./FiberInfoSection";
import { FiberInfoSectionContexts } from "./FiberInfoProviderSection";
import { FiberInfoSectionConsumers } from "./FiberInfoSectionConsumers";
import { FiberInfoSectionMemo } from "./FiberInfoSectionMemo";

interface IFiberInfo {
  fiberId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
}

const FiberInfo = ({ fiberId, groupByParent, showUnmounted }: IFiberInfo) => {
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(fiberId);

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

      {false && <FiberInfoSection header="Timing"></FiberInfoSection>}
      {fiber.typeDef.contexts && (
        <FiberInfoSection header="Contexts" emptyText="no contexts">
          <FiberInfoSectionContexts fiber={fiber} />
        </FiberInfoSection>
      )}
      {fiber.type === ElementTypeProvider && (
        <FiberInfoSectionConsumers fiber={fiber} />
      )}
      <FiberInfoSectionMemo fiber={fiber} />
    </div>
  );
};

const FiberInfoMemo = React.memo(FiberInfo);
FiberInfoMemo.displayName = "FiberInfo";

export default FiberInfoMemo;
