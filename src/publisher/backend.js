import { attach } from "./renderer.js";
import { separateDisplayNameAndHOCs, utfDecodeString } from "./utils";

import {
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeFunction,
  ElementTypeForwardRef,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
  ElementTypeSuspenseList,
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_REMOVE_ROOT,
  LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
  SESSION_STORAGE_LAST_SELECTION_KEY,
  LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY,
  SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
  SESSION_STORAGE_RELOAD_AND_PROFILE_KEY,
  LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
  LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY,
  LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
  LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
  PROFILER_EXPORT_VERSION,
  CHANGE_LOG_URL,
  UNSUPPORTED_VERSION_URL,
  REACT_DEVTOOLS_WORKPLACE_URL,
} from "./constants.js";
import { publisher } from "./rempl-publisher";

const idToElement = new Map();
const rootIDToRendererID = new Map();
const rootIDToCapabilities = new Map();
const ownersMap = new Map();
const errorsAndWarnings = new Map();

let latestCommitProfilingMetadata = null;

let revision = 0;
let weightAcrossRoots = 0;
let cachedErrorCount = 0;
let cachedWarningCount = 0;
let cachedErrorAndWarningTuples = [];
let storedActions = [];
let hasOwnerMetadata = false;
let supportsNativeInspection = true;
let supportsProfiling = false;
let supportsReloadAndProfile = false;
let supportsSchedulingProfiler = false;
let supportsTraceUpdates = false;

let roots = [];

const adjustParentTreeWeight = (parentElement, weightDelta) => {
  let isInsideCollapsedSubTree = false;

  while (parentElement != null) {
    parentElement.weight += weightDelta;

    // Additions and deletions within a collapsed subtree should not bubble beyond the collapsed parent.
    // Their weight will bubble up when the parent is expanded.
    if (parentElement.isCollapsed) {
      isInsideCollapsedSubTree = true;
      break;
    }

    parentElement = idToElement.get(parentElement.parentID);
  }

  // Additions and deletions within a collapsed subtree should not affect the overall number of elements.
  if (!isInsideCollapsedSubTree) {
    weightAcrossRoots += weightDelta;
  }
};

const getElementByID = id => {
  const element = idToElement.get(id);
  if (element == null) {
    console.warn(`No element found with id "${id}"`);
    return null;
  }

  return element;
};

const getIndexOfElementID = id => {
  const element = getElementByID(id);

  if (element === null || element.parentID === 0) {
    return null;
  }

  // Walk up the tree to the root.
  // Increment the index by one for each node we encounter,
  // and by the weight of all nodes to the left of the current one.
  // This should be a relatively fast way of determining the index of a node within the tree.
  let previousID = id;
  let currentID = element.parentID;
  let index = 0;
  while (true) {
    const current = idToElement.get(currentID);

    const { children } = current;
    for (let i = 0; i < children.length; i++) {
      const childID = children[i];
      if (childID === previousID) {
        break;
      }
      const child = idToElement.get(childID);
      index += child.isCollapsed ? 1 : child.weight;
    }

    if (current.parentID === 0) {
      // We found the root; stop crawling.
      break;
    }

    index++;

    previousID = current.id;
    currentID = current.parentID;
  }

  // At this point, the current ID is a root (from the previous loop).
  // We also need to offset the index by previous root weights.
  for (let i = 0; i < roots.length; i++) {
    const rootID = roots[i];
    if (rootID === currentID) {
      break;
    }
    const root = idToElement.get(rootID);
    index += root.weight;
  }

  return index;
};

export function init(hook, global, agent = {}) {
  if (hook == null) {
    // DevTools didn't get injected into this page (maybe b'c of the contentType).
    return () => {};
  }
  const subs = [
    hook.sub("renderer-attached", ({ id, renderer, rendererInterface }) => {
      // agent.setRendererInterface(id, rendererInterface);
      // Now that the Store and the renderer interface are connected,
      // it's time to flush the pending operation codes to the frontend.
      rendererInterface.flushInitialOperations();
      rendererInterface.startProfiling(true);
    }),

    hook.sub("unsupported-renderer-version", id => {
      // agent.onUnsupportedRenderer(id);
    }),

    // hook.sub("fastRefreshScheduled", agent.onFastRefreshScheduled),
    hook.sub(
      "operations",
      ({ operations, getDisplayNameForFiberID, getFiberByID }) => {
        let haveRootsChanged = false;
        let haveErrorsOrWarningsChanged = false;

        // The first two values are always rendererID and rootID
        const rendererID = operations[0];

        const addedElementIDs = [];
        // This is a mapping of removed ID -> parent ID:
        const removedElementIDs = new Map();
        // We'll use the parent ID to adjust selection if it gets deleted.

        let i = 2;

        // Reassemble the string table.
        const stringTable = [
          null, // ID = 0 corresponds to the null string.
        ];
        const stringTableSize = operations[i++];
        const stringTableEnd = i + stringTableSize;
        while (i < stringTableEnd) {
          const nextLength = operations[i++];
          const nextString = utfDecodeString(
            operations.slice(i, i + nextLength)
          );
          stringTable.push(nextString);
          i += nextLength;
        }

        while (i < operations.length) {
          const operation = operations[i];
          switch (operation) {
            case TREE_OPERATION_ADD: {
              const id = operations[i + 1];
              const type = operations[i + 2];

              i += 3;

              if (idToElement.has(id)) {
                throw new Error(
                  `Cannot add node "${id}" because a node with that id is already in the Store.`
                );
              }

              let ownerID = 0;
              let parentID = null;
              if (type === ElementTypeRoot) {
                const supportsProfiling = operations[i] > 0;
                i++;

                const hasOwnerMetadata = operations[i] > 0;
                i++;

                roots = roots.concat(id);
                rootIDToRendererID.set(id, rendererID);
                rootIDToCapabilities.set(id, {
                  hasOwnerMetadata,
                  supportsProfiling,
                });

                idToElement.set(id, {
                  children: [],
                  depth: -1,
                  displayName: null,
                  hocDisplayNames: null,
                  id,
                  isCollapsed: false, // Never collapse roots; it would hide the entire tree.
                  key: null,
                  ownerID: 0,
                  parentID: 0,
                  type,
                  weight: 0,
                });

                haveRootsChanged = true;
              } else {
                parentID = operations[i];
                i++;

                ownerID = operations[i];
                i++;

                const displayNameStringID = operations[i];
                const displayName = stringTable[displayNameStringID];
                i++;

                const keyStringID = operations[i];
                const key = stringTable[keyStringID];
                i++;

                if (!idToElement.has(parentID)) {
                  throw new Error(
                    `Cannot add child "${id}" to parent "${parentID}" because parent node was not found in the Store.`
                  );
                }

                const parentElement = idToElement.get(parentID);

                parentElement.children.push(id);

                const [displayNameWithoutHOCs, hocDisplayNames] =
                  separateDisplayNameAndHOCs(displayName, type);

                const element = {
                  children: [],
                  depth: parentElement.depth + 1,
                  displayName: displayNameWithoutHOCs,
                  hocDisplayNames,
                  id,
                  isCollapsed: false,
                  key,
                  ownerID,
                  parentID: parentElement.id,
                  type,
                  weight: 1,
                };

                idToElement.set(id, element);
                addedElementIDs.push(id);
                adjustParentTreeWeight(parentElement, 1);

                if (ownerID > 0) {
                  let set = ownersMap.get(ownerID);
                  if (set === undefined) {
                    set = new Set();
                    ownersMap.set(ownerID, set);
                  }
                  set.add(id);
                }
              }
              break;
            }
            case TREE_OPERATION_REMOVE: {
              const removeLength = operations[i + 1];
              i += 2;

              for (
                let removeIndex = 0;
                removeIndex < removeLength;
                removeIndex++
              ) {
                const id = operations[i];

                if (!idToElement.has(id)) {
                  throw new Error(
                    `Cannot remove node "${id}" because no matching node was found in the Store.`
                  );
                }

                i += 1;

                const element = idToElement.get(id);
                const { children, ownerID, parentID, weight } = element;
                if (children.length > 0) {
                  throw new Error(
                    `Node "${id}" was removed before its children.`
                  );
                }

                idToElement.delete(id);

                let parentElement = null;
                if (parentID === 0) {
                  roots = roots.filter(rootID => rootID !== id);
                  rootIDToRendererID.delete(id);
                  rootIDToCapabilities.delete(id);

                  haveRootsChanged = true;
                } else {
                  parentElement = idToElement.get(parentID);
                  if (parentElement === undefined) {
                    throw new Error(
                      `Cannot remove node "${id}" from parent "${parentID}" because no matching node was found in the Store.`
                    );
                  }
                  const index = parentElement.children.indexOf(id);
                  parentElement.children.splice(index, 1);
                }

                adjustParentTreeWeight(parentElement, -weight);
                removedElementIDs.set(id, parentID);

                ownersMap.delete(id);
                if (ownerID > 0) {
                  const set = ownersMap.get(ownerID);
                  if (set !== undefined) {
                    set.delete(id);
                  }
                }

                if (errorsAndWarnings.has(id)) {
                  errorsAndWarnings.delete(id);
                  haveErrorsOrWarningsChanged = true;
                }
              }
              break;
            }
            case TREE_OPERATION_REMOVE_ROOT: {
              i += 1;

              const id = operations[1];

              const recursivelyDeleteElements = elementID => {
                const element = idToElement.get(elementID);
                idToElement.delete(elementID);
                if (element) {
                  // Mostly for Flow's sake
                  for (
                    let index = 0;
                    index < element.children.length;
                    index++
                  ) {
                    recursivelyDeleteElements(element.children[index]);
                  }
                }
              };

              const root = idToElement.get(id);
              recursivelyDeleteElements(id);

              rootIDToCapabilities.delete(id);
              rootIDToRendererID.delete(id);
              roots = roots.filter(rootID => rootID !== id);
              weightAcrossRoots -= root.weight;
              break;
            }
            case TREE_OPERATION_REORDER_CHILDREN: {
              const id = operations[i + 1];
              const numChildren = operations[i + 2];
              i += 3;

              if (!idToElement.has(id)) {
                throw new Error(
                  `Cannot reorder children for node "${id}" because no matching node was found in the Store.`
                );
              }

              const element = idToElement.get(id);
              const children = element.children;
              if (children.length !== numChildren) {
                throw new Error(
                  `Children cannot be added or removed during a reorder operation.`
                );
              }

              for (let j = 0; j < numChildren; j++) {
                children[j] = operations[i + j];
              }
              i += numChildren;

              break;
            }
            case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
              // Base duration updates are only sent while profiling is in progress.
              // We can ignore them at this point.
              // The profiler UI uses them lazily in order to generate the tree.
              i += 3;
              break;
            case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS:
              const id = operations[i + 1];
              const errorCount = operations[i + 2];
              const warningCount = operations[i + 3];

              i += 4;

              if (errorCount > 0 || warningCount > 0) {
                errorsAndWarnings.set(id, { errorCount, warningCount });
              } else if (errorsAndWarnings.has(id)) {
                errorsAndWarnings.delete(id);
              }
              haveErrorsOrWarningsChanged = true;
              break;
            default:
              throw new Error(`Unsupported Bridge operation "${operation}"`);
          }
        }

        revision++;

        if (haveErrorsOrWarningsChanged) {
          let errorCount = 0;
          let warningCount = 0;

          errorsAndWarnings.forEach(entry => {
            errorCount += entry.errorCount;
            warningCount += entry.warningCount;
          });

          cachedErrorCount = errorCount;
          cachedWarningCount = warningCount;

          const errorAndWarningTuples = [];

          errorsAndWarnings.forEach((_, id) => {
            const index = getIndexOfElementID(id);
            if (index !== null) {
              let low = 0;
              let high = errorAndWarningTuples.length;
              while (low < high) {
                const mid = (low + high) >> 1;
                if (errorAndWarningTuples[mid].index > index) {
                  high = mid;
                } else {
                  low = mid + 1;
                }
              }

              errorAndWarningTuples.splice(low, 0, { id, index });
            }
          });

          cachedErrorAndWarningTuples = errorAndWarningTuples;
        }

        if (haveRootsChanged) {
          const prevSupportsProfiling = supportsProfiling;

          hasOwnerMetadata = false;
          supportsProfiling = false;
          rootIDToCapabilities.forEach(
            ({ hasOwnerMetadata, supportsProfiling }) => {
              if (hasOwnerMetadata) {
                hasOwnerMetadata = true;
              }
              if (supportsProfiling) {
                supportsProfiling = true;
              }
            }
          );

          if (supportsProfiling !== prevSupportsProfiling) {
            console.log("supportsProfiling");
          }
        }

        if (
          addedElementIDs.length ||
          latestCommitProfilingMetadata ||
          removedElementIDs.size
        ) {
          if (latestCommitProfilingMetadata) {
            for (const [
              id,
              { didHooksChange, hooks },
            ] of latestCommitProfilingMetadata.changeDescriptions) {
              if (didHooksChange && hooks && hooks.length) {
                const { _debugHookTypes } = getFiberByID(id);

                hooks.forEach(hook => {
                  hook.name = _debugHookTypes[hook.index + 1];
                });
              }
            }
          }

          const payload = {
            addedElements: addedElementIDs.map(id => {
              return idToElement.get(id);
            }),
            removedElementIDs: [...removedElementIDs].map(([id]) => id),
            latestCommitProfilingMetadata: {
              ...latestCommitProfilingMetadata,
              changeDescriptions: Object.fromEntries(
                latestCommitProfilingMetadata.changeDescriptions
              ),
            },
          };

          storedActions.push(payload);

          publisher.ns("tree-changes").publish(storedActions);
        }

        latestCommitProfilingMetadata = null;
      }
    ),

    hook.sub("commit", commitProfilingMetadata => {
      latestCommitProfilingMetadata = commitProfilingMetadata;
    }),

    // hook.sub("traceUpdates", console.log),

    // TODO Add additional subscriptions required for profiling mode
  ];

  const attachRenderer = (id, renderer) => {
    let rendererInterface = hook.rendererInterfaces.get(id);

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (rendererInterface == null) {
      if (typeof renderer.findFiberByHostInstance === "function") {
        // react-reconciler v16+
        rendererInterface = attach(hook, id, renderer, global);
      }

      if (rendererInterface != null) {
        hook.rendererInterfaces.set(id, rendererInterface);
      }
    }

    // Notify the DevTools frontend about new renderers.
    // This includes any that were attached early (via __REACT_DEVTOOLS_ATTACH__).
    if (rendererInterface != null) {
      hook.emit("renderer-attached", {
        id,
        renderer,
        rendererInterface,
      });
    } else {
      hook.emit("unsupported-renderer-version", id);
    }
  };

  // Connect renderers that have already injected themselves.
  hook.renderers.forEach((renderer, id) => {
    attachRenderer(id, renderer);
  });

  // Connect any new renderers that injected themselves.
  subs.push(
    hook.sub("renderer", ({ id, renderer }) => {
      attachRenderer(id, renderer);
    })
  );

  // hook.emit("react-devtools", agent);

  // hook.reactDevtoolsAgent = agent;

  // const onAgentShutdown = () => {
  //   subs.forEach(fn => fn());
  //   hook.rendererInterfaces.forEach(rendererInterface => {
  //     rendererInterface.cleanup();
  //   });
  //   hook.reactDevtoolsAgent = null;
  // };

  // agent.addListener("shutdown", onAgentShutdown);

  subs.push(() => {
    // agent.removeListener("shutdown", onAgentShutdown);
  });

  return () => {
    subs.forEach(fn => fn());
  };
}
