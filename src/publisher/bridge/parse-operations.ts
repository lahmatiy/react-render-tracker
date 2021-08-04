import {
  AddElementMessage,
  Element,
  ElementType,
  RemoveElementMessage,
} from "../types";
import { separateDisplayNameAndHOCs, utfDecodeString } from "../utils";
import {
  ElementTypeRoot,
  TREE_OPERATION_MOUNT,
  TREE_OPERATION_UNMOUNT,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from "../constants";

/**
 * Decodes operations produced by renderer
 * {@link packages/react-devtools-shared/src/devtools/store.js#onBridgeOperations}
 */
export function parseOperations(
  operations: number[],
  idToElement: Map<number, Element>
) {
  // The first two values are always rendererID and rootID
  const rendererId = operations[0];

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

  const output: (AddElementMessage | RemoveElementMessage)[] = [];

  while (i < operations.length) {
    const operation = operations[i];
    switch (operation) {
      case TREE_OPERATION_MOUNT: {
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

          const element: Element = {
            children: [],
            depth: -1,
            displayName: null,
            hocDisplayNames: null,
            id,
            key: null,
            ownerId: 0,
            parentId: 0,
            type,
          };

          idToElement.set(id, element);
          output.push({ op: "add", id, element });
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

          if (ownerId === 0) {
            ownerId = parentElement.ownerId || parentElement.id;
          }

          const [displayNameWithoutHOCs, hocDisplayNames] =
            separateDisplayNameAndHOCs(displayName, type);

          const element: Element = {
            children: [],
            depth: parentElement.depth + 1,
            displayName: displayNameWithoutHOCs,
            hocDisplayNames,
            id,
            key,
            ownerId,
            parentId: parentElement.id,
            type,
          };

          idToElement.set(id, element);
          output.push({ op: "add", id, element });
        }
        break;
      }
      case TREE_OPERATION_UNMOUNT: {
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
          const { children, parentId } = element;
          let parentElement = null;

          if (children.length > 0) {
            throw new Error(`Node "${id}" was removed before its children.`);
          }

          idToElement.delete(id);

          if (parentId !== 0) {
            parentElement = idToElement.get(parentId);
            if (parentElement === undefined) {
              throw new Error(
                `Cannot remove node "${id}" from parent "${parentId}" because no matching node was found in the Store.`
              );
            }
            const index = parentElement.children.indexOf(id);
            parentElement.children.splice(index, 1);
          }

          output.push({ op: "remove", id, timestamp: Date.now() });
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
          output.push({ op: "remove", id: elementId, timestamp: Date.now() });

          for (let index = 0; index < element.children.length; index++) {
            recursivelyDeleteElements(element.children[index]);
          }
        };

        recursivelyDeleteElements(id);
        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
        // Base duration updates are only sent while profiling is in progress.
        // We can ignore them at this point.
        // The profiler UI uses them lazily in order to generate the tree.
        i += 3;
        break;
      default:
        throw new Error(`Unsupported operation "${operation}"`);
    }
  }

  return output;
}
