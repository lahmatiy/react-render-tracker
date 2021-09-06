import { TestCase } from "../types";

export default [
  getDefault(import("./basic")),
  getDefault(import("./basic-nested-set-state")),
  getDefault(import("./basic-nested-props-change")),
  getDefault(import("./basic-parent-element-change")),
  getDefault(import("./basic-context-change")),
  getDefault(import("./mount-unmount")),
  getDefault(import("./complex-composition-on-one-component")),
  getDefault(import("./set-state-by-event-handler")),
  getDefault(import("./class-component")),
  getDefault(import("./app")),
];

function getDefault(dynImport: Promise<{ default: TestCase }>) {
  return dynImport.then(exports => exports.default);
}
