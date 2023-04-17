import { createIntegrationCore } from "./core";
import { createReactDevtoolsHookHandlers } from "./devtools-hook-handlers";
import { createReactInteractionApi } from "./interaction-api";
import {
  ReactInternals,
  ReactIntegrationApi,
  RecordEventHandler,
} from "../types";
import { createDispatcherTrap } from "./dispatcher-trap";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler
): ReactIntegrationApi {
  const integrationCore = createIntegrationCore(renderer, recordEvent);
  const dispatcherApi = createDispatcherTrap(renderer, integrationCore);

  return {
    ...createReactDevtoolsHookHandlers(
      integrationCore,
      dispatcherApi,
      recordEvent
    ),
    ...createReactInteractionApi(integrationCore),
    getLeakedObjectsProbe: integrationCore.getLeakedObjectsProbe,
  };
}
