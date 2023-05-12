import * as React from "react";
import { MessageFiber } from "../../../types";
import { useFiber } from "../../../utils/fiber-maps";
import { ResolveSourceLoc } from "../../common/SourceLoc";
import { CallTracePath } from "../CallStack";
import { FiberInfoSection } from "./FiberInfoSection";

export function FiberInfoSectionLeakedHooks({
  fiber,
}: {
  fiber: MessageFiber;
}) {
  const { typeDef, leakedHooks } = useFiber(fiber.id) || {};

  return (
    <FiberInfoSection
      id="leaked-hooks"
      header={`Leaked hooks (${leakedHooks?.length})`}
    >
      <ol className="fiber-info-section-leaks-content">
        {leakedHooks &&
          leakedHooks.map(hookIdx => {
            const hook = typeDef?.hooks[hookIdx];
            console.log(hookIdx, hook);

            return (
              hook && (
                <li key={hookIdx}>
                  <CallTracePath
                    key={hook.index}
                    expanded
                    path={hook.trace.path}
                  />
                  <ResolveSourceLoc loc={hook.trace.loc}>
                    {hook.name}(…)
                  </ResolveSourceLoc>{" "}
                </li>
              )
            );
          })}
      </ol>
    </FiberInfoSection>
  );
}
