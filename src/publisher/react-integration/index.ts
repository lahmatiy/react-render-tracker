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
import { hook } from "../index";
import { publishHighlightEvent } from "../rempl-publisher";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler,
  removeCommands: (api: RemoteCommandsApi) => void
): ReactIntegrationApi {
  const integrationCore = createIntegrationCore(renderer, recordEvent);
  const dispatcherApi = createDispatcherTrap(renderer, integrationCore);
  const highlightApi = createHighlightApi(hook, publishHighlightEvent);

  removeCommands({
    breakLeakedObjectRefs: integrationCore.breakLeakedObjectRefs,
    highlightApi
  });

  return {
    ...createReactDevtoolsHookHandlers(
      integrationCore,
      dispatcherApi,
      recordEvent
    ),
    ...createReactInteractionApi(integrationCore),
    getLeakedObjectsProbe: integrationCore.getLeakedObjectsProbe,
    breakLeakedObjectRefs: integrationCore.breakLeakedObjectRefs,
  };
}
