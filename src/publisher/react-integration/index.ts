import { createIntegrationCore } from "./core";
import { createReactDevtoolsHookHandlers } from "./devtools-hook-handlers";
import { createReactInteractionApi } from "./interaction-api";
import {
  ReactInternals,
  ReactIntegrationApi,
  RecordEventHandler,
  RemoteCommandsApi,
} from "../types";
import { createDispatcherTrap } from "./dispatcher-trap";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler,
  removeCommands: (api: RemoteCommandsApi) => void
): ReactIntegrationApi {
  const integrationCore = createIntegrationCore(renderer, recordEvent);
  const dispatcherApi = createDispatcherTrap(renderer, integrationCore);

  removeCommands({
    ...integrationCore.memoryLeaksApi,
  });

  return {
    ...createReactDevtoolsHookHandlers(
      integrationCore,
      dispatcherApi,
      recordEvent
    ),
    ...createReactInteractionApi(integrationCore),
    ...integrationCore.memoryLeaksApi,
  };
}
