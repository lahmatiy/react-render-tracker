import { createCommonApi } from "./common";
import { createHookHandlers } from "./hook-handlers";
import { createInteractionApi } from "./interaction-api";
import {
  ReactInternals,
  RendererInterface,
  RecordEventHandler,
} from "../types";

export function attach(
  renderer: ReactInternals,
  recordEvent: RecordEventHandler
): RendererInterface {
  const common = createCommonApi(renderer);

  return {
    ...createHookHandlers(common, recordEvent),
    ...createInteractionApi(common),
  };
}
