import { createIntegrationCore } from "./core";
import { createReactDevtoolsHookHandlers } from "./devtools-hook-handlers";
import { createReactInteractionApi } from "./interaction-api";
import { ReactInternals, ReactIntegration, RecordEventHandler } from "../types";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler
): ReactIntegration {
  const integrationCore = createIntegrationCore(renderer);

  return {
    ...createReactDevtoolsHookHandlers(integrationCore, recordEvent),
    ...createReactInteractionApi(integrationCore),
  };
}
