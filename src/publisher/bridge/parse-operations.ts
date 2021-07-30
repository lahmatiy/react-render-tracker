import { Element, ElementType } from "../types";
import { separateDisplayNameAndHOCs, utfDecodeString } from "../utils";
import {
  ElementTypeRoot,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from "../constants";

/**
 * FIXME: temporarily global as current operation processing requires knowledge of previous elements
 */
const idToElement = new Map<number, Element>();
/**
 * Map of element (id) to the set of elements (ids) it owns.
 * This map enables getOwnersListForElement() to avoid traversing the entire tree.
 *
 * FIXME: temporarily global as current operation processing requires knowledge of previous elements
 */
const ownersMap = new Map<number, Set<number>>();

/**
 * Decodes operations produced by react
 * {@link packages/react-devtools-shared/src/devtools/store.js#onBridgeOperations}
 */
export function parseOperations(operations: number[]) {
  let haveRootsChanged = false;

  // The first two values are always rendererID and rootID
  const rendererId = operations[0];

  const addedElementIds: Array<number> = [];
  // This is a mapping of removed ID -> parent ID:
  const removedElementIds: Map<number, number> = new Map();
  // We'll use the parent ID to adjust selection if it gets deleted.

  let i = 2;

  // Reassemble the string table.
  const stringTable: Array<null | string> = [
    null, // ID = 0 corresponds to the null string.
  ];
  const stringTableSize = operations[i++];
  const stringTableEnd = i + stringTableSize;

  while (i < stringTableEnd) {
    const nextLength = operations[i++];
    const nextString = utfDecodeString(operations.slice(i, i + nextLength));
    stringTable.push(nextString);
    i += nextLength;
  }

  while (i < operations.length) {
    const operation = operations[i];
    switch (operation) {
      case TREE_OPERATION_ADD: {
        const id = operations[i + 1];
        const type = operations[i + 2] as ElementType;

        i += 3;

        if (idToElement.has(id)) {
          throw new Error(
            `Cannot add node "${id}" because a node with that id is already in the Store.`
          );
        }

        let ownerId = 0;
        let parentId = null;
        if (type === ElementTypeRoot) {
          // const supportsProfiling = operations[i] > 0;
          i++;

          // const hasOwnerMetadata = operations[i] > 0;
          i++;

          idToElement.set(id, {
            children: [],
            depth: -1,
            displayName: null,
            hocDisplayNames: null,
            id,
            key: null,
            ownerId: 0,
            parentId: 0,
            type,
            weight: 0,
          });

          haveRootsChanged = true;
        } else {
          parentId = operations[i];
          i++;

          ownerId = operations[i];
          i++;

          const displayNameStringId = operations[i];
          const displayName = stringTable[displayNameStringId];
          i++;

          const keyStringId = operations[i];
          const key = stringTable[keyStringId];
          i++;

          if (!idToElement.has(parentId)) {
            throw new Error(
              `Cannot add child "${id}" to parent "${parentId}" because parent node was not found in the Store.`
            );
          }

          const parentElement = idToElement.get(parentId)!;
          parentElement.children.push(id);

          const [displayNameWithoutHOCs, hocDisplayNames] =
            separateDisplayNameAndHOCs(displayName, type);

          const element: Element = {
            children: [],
            depth: parentElement.depth + 1,
            displayName: displayNameWithoutHOCs,
            hocDisplayNames,
            id,
            key,
            ownerId: ownerId,
            parentId: parentElement.id,
            type,
            weight: 1,
          };

          idToElement.set(id, element);
          addedElementIds.push(id);

          if (ownerId > 0) {
            let set = ownersMap.get(ownerId);
            if (set === undefined) {
              set = new Set();
              ownersMap.set(ownerId, set);
            }
            set.add(id);
          }
        }
        break;
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = operations[i + 1];
        i += 2;

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          const id = operations[i];

          if (!idToElement.has(id)) {
            throw new Error(
              `Cannot remove node "${id}" because no matching node was found in the Store.`
            );
          }

          i += 1;

          const element = idToElement.get(id)!;
          const { children, ownerId, parentId } = element;
          if (children.length > 0) {
            throw new Error(`Node "${id}" was removed before its children.`);
          }

          idToElement.delete(id);

          let parentElement = null;
          if (parentId === 0) {
            haveRootsChanged = true;
          } else {
            parentElement = idToElement.get(parentId);
            if (parentElement === undefined) {
              throw new Error(
                `Cannot remove node "${id}" from parent "${parentId}" because no matching node was found in the Store.`
              );
            }
            const index = parentElement.children.indexOf(id);
            parentElement.children.splice(index, 1);
          }

          removedElementIds.set(id, parentId);

          ownersMap.delete(id);
          if (ownerId > 0) {
            const set = ownersMap.get(ownerId);
            if (set !== undefined) {
              set.delete(id);
            }
          }
        }
        break;
      }
      case TREE_OPERATION_REMOVE_ROOT: {
        i += 1;

        const id = operations[1];

        const recursivelyDeleteElements = (elementId: number) => {
          const element = idToElement.get(elementId);
          if (!element) {
            return;
          }

          idToElement.delete(elementId);

          for (let index = 0; index < element.children.length; index++) {
            recursivelyDeleteElements(element.children[index]);
          }
        };

        recursivelyDeleteElements(id);
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

        const element = idToElement.get(id)!;
        const children = element.children;
        if (children.length !== numChildren) {
          throw new Error(
            `Children cannot be added or removed during a reorder operation.`
          );
        }

        for (let j = 0; j < numChildren; j++) {
          const childID = operations[i + j];
          children[j] = childID;

          // FIXME
          const __DEV__ = true;
          if (__DEV__) {
            // This check is more expensive so it's gated by __DEV__.
            const childElement = idToElement.get(childID);
            if (childElement == null || childElement.parentId !== id) {
              console.error(
                `Children cannot be added or removed during a reorder operation.`
              );
            }
          }
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
        // FIXME: no idea
        // const id = operations[i + 1];
        // const errorCount = operations[i + 2];
        // const warningCount = operations[i + 3];
        //
        i += 4;
        //
        // if (errorCount > 0 || warningCount > 0) {
        //   this._errorsAndWarnings.set(id, { errorCount, warningCount });
        // } else if (this._errorsAndWarnings.has(id)) {
        //   this._errorsAndWarnings.delete(id);
        // }
        // haveErrorsOrWarningsChanged = true;
        break;
      default:
        throw new Error(`Unsupported operation "${operation}"`);
    }
  }

  if (addedElementIds.length || removedElementIds.size) {
    return {
      rendererId: rendererId,
      addedElements: addedElementIds.map(id => idToElement.get(id)),
      removedElementIds: Array.from(removedElementIds).map(([id]) => id),
    };
  }
}
