import * as React from "react";
import {
  MessageFiber,
  TransferFiberContext,
  TransferCallTrace,
} from "../../../types";
import { CallTraceList } from "../CallStack";
import { FiberLink } from "../FiberLink";

export function FiberInfoSectionContexts({ fiber }: { fiber: MessageFiber }) {
  const { typeDef } = fiber;

  if (!Array.isArray(typeDef.contexts)) {
    return null;
  }

  const contextReadMap = typeDef.hooks.reduce((map, hook) => {
    if (hook.context) {
      const traces = map.get(hook.context);
      if (traces === undefined) {
        map.set(hook.context, [hook.trace]);
      } else {
        traces.push(hook.trace);
      }
    }
    return map;
  }, new Map<TransferFiberContext, TransferCallTrace[]>());

  return (
    <>
      {typeDef.contexts.map((context, index) => {
        const traces = contextReadMap.get(context);

        return (
          <div key={index}>
            {context.providerId !== undefined ? (
              <FiberLink id={context.providerId} name={context.name} />
            ) : (
              <>
                {context.name}{" "}
                <span className="fiber-info-fiber-context__no-provider">
                  No provider found
                </span>
              </>
            )}
            {traces && (
              <div className="fiber-info-fiber-context__reads">
                <CallTraceList expanded compat={false} traces={traces} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
