import { Fiber } from "../../types";

export function getFiberFlags(fiber: Fiber): number {
  // The name of this field changed from "effectTag" to "flags"
  return (
    (fiber.flags !== undefined ? fiber.flags : (fiber as any).effectTag) ?? 0
  );
}
