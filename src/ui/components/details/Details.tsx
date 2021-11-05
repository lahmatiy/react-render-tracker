import * as React from "react";
import FiberInfo from "./info/FiberInfo";
import { FiberInfoHeader } from "./FiberHeader";
import { useFiberMaps } from "../../utils/fiber-maps";

interface DetailsProps {
  rootId: number;
  groupByParent: boolean;
  showUnmounted: boolean;
  showTimings: boolean;
}

const Details = ({
  rootId,
  groupByParent = false,
  showUnmounted = true,
  showTimings = false,
}: DetailsProps) => {
  const [scrolled, setScrolled] = React.useState(false);
  const { fiberById } = useFiberMaps();
  const fiber = fiberById.get(rootId);

  if (fiber === undefined) {
    return (
      <div className="details">
        <div className="fiber-info">Fiber with #{rootId} is not found</div>;
      </div>
    );
  }

  return (
    <div className="details">
      <div
        className={
          "details__header" +
          (scrolled ? " details__header_content-scrolled" : "")
        }
      >
        <FiberInfoHeader
          fiber={fiber}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
        />
      </div>
      <div
        className="details__content"
        onScroll={e => setScrolled((e.target as HTMLDivElement).scrollTop > 0)}
      >
        <FiberInfo
          fiber={fiber}
          groupByParent={groupByParent}
          showUnmounted={showUnmounted}
          showTimings={showTimings}
        />
      </div>
    </div>
  );
};

const DetailsMemo = React.memo(Details);
DetailsMemo.displayName = "Details";

export default DetailsMemo;
