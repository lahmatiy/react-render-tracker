import { TestCase } from "../types";

export default [
  getDefault(import("./mount-unmount")),
  getDefault(import("./class-component")),
  getDefault(import("./complex-composition-on-one-component")),
  getDefault(import("./basic")),
  getDefault(import("./basic-nested-set-state")),
  getDefault(import("./basic-nested-props-change")),
  getDefault(import("./basic-parent-element-change")),
  getDefault(import("./basic-context-change")),
  getDefault(import("./set-state-by-event-handler")),
] as Promise<TestCase>[];

function getDefault(dynImport) {
  return dynImport.then(exports => exports.default);
}
