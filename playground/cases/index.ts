import { TestCase } from "../types";

export default [
  getDefault(import("./basic")),
  getDefault(import("./class-component")),
  getDefault(import("./basic-nested-set-state")),
  getDefault(import("./props-changes")),
  getDefault(import("./basic-parent-element-change")),
  getDefault(import("./context")),
  getDefault(import("./hooks")),
  getDefault(import("./bailouts")),
  getDefault(import("./mount-unmount")),
  getDefault(import("./complex-composition-on-one-component")),
  getDefault(import("./set-state-by-event-handler")),
  getDefault(import("./use-effects")),
  getDefault(import("./suspense")),
  getDefault(import("./app")),
];

function getDefault(dynImport: Promise<{ default: TestCase }>) {
  return dynImport.then(exports => exports.default);
}
