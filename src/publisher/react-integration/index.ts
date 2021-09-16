import { createIntegrationCore } from "./core";
import { createReactDevtoolsHookHandlers } from "./devtools-hook-handlers";
import { createReactInteractionApi } from "./interaction-api";
import { ReactInternals, ReactIntegration, RecordEventHandler } from "../types";
import { dispatcherTrap } from "./dispatcher-trap";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler
): ReactIntegration {
  const integrationCore = createIntegrationCore(renderer);
  const dispatcherApi = dispatcherTrap(renderer);

  return {
    ...createReactDevtoolsHookHandlers(
      integrationCore,
      dispatcherApi,
      recordEvent
    ),
    ...createReactInteractionApi(integrationCore),
  };
}
