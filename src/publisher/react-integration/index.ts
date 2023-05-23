import { createIntegrationCore } from "./core";
import { createReactDevtoolsHookHandlers } from "./devtools-hook-handlers";
import { createReactInteractionApi } from "./interaction-api";
import { createHighlightApi } from "./highlight-api";
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
  const interactionApi = createReactInteractionApi(integrationCore);
  const highlightApi = createHighlightApi(interactionApi);

  removeCommands({
    highlightApi,
    ...integrationCore.memoryLeaksApi,
  });

  return {
    ...createReactDevtoolsHookHandlers(
      integrationCore,
      dispatcherApi,
      recordEvent
    ),
    ...interactionApi,
    ...integrationCore.memoryLeaksApi,
  };
}
