import { ElementType } from "../types";
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
} from "../constants";

export function utfDecodeString(array: Array<number>): string {
  return String.fromCodePoint(...array);
}

export function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null];
  }

  let parsedDisplayName = displayName;
  let hocDisplayNames = null;

  switch (type) {
    case ElementTypeClass:
    case ElementTypeForwardRef:
    case ElementTypeFunction:
    case ElementTypeMemo:
      if (parsedDisplayName.indexOf("(") >= 0) {
        const matches = parsedDisplayName.match(/[^()]+/g);
        if (matches != null) {
          parsedDisplayName = matches.pop()!;
          hocDisplayNames = matches;
        }
      }
      break;
    default:
      break;
  }

  if (type === ElementTypeMemo) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ["Memo"];
    } else {
      hocDisplayNames.unshift("Memo");
    }
  } else if (type === ElementTypeForwardRef) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ["ForwardRef"];
    } else {
      hocDisplayNames.unshift("ForwardRef");
    }
  }

  return [parsedDisplayName, hocDisplayNames];
}

let uidCounter = 0;

export function getUID() {
  return ++uidCounter;
}

const cachedDisplayNames = new WeakMap();

export function getDisplayName(type, fallbackName) {
  const nameFromCache = cachedDisplayNames.get(type);

  if (nameFromCache != null) {
    return nameFromCache;
  }

  let displayName = fallbackName;

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === "string") {
    displayName = type.displayName;
  } else if (typeof type.name === "string" && type.name !== "") {
    displayName = type.name;
  }

  cachedDisplayNames.set(type, displayName);
  return displayName;
}

export function utfEncodeString(value: string) {
  const encoded = new Array(value.length);

  for (let i = 0; i < value.length; i++) {
    encoded[i] = value.codePointAt(i);
  }

  return encoded;
}

export function copyWithDelete(obj, path, index) {
  const key = path[index];
  const updated = Array.isArray(obj) ? obj.slice() : { ...obj };
  if (index + 1 === path.length) {
    if (Array.isArray(updated)) {
      updated.splice(key, 1);
    } else {
      delete updated[key];
    }
  } else {
    // $FlowFixMe number or string is fine here
    updated[key] = copyWithDelete(obj[key], path, index + 1);
  }
  return updated;
}

export function renamePathInObject(object, oldPath, newPath) {
  const length = oldPath.length;
  if (object != null) {
    const parent = getInObject(object, oldPath.slice(0, length - 1));
    if (parent) {
      const lastOld = oldPath[length - 1];
      const lastNew = newPath[length - 1];
      parent[lastNew] = parent[lastOld];
      if (Array.isArray(parent)) {
        parent.splice(lastOld, 1);
      } else {
        delete parent[lastOld];
      }
    }
  }
}

export function copyWithRename(obj, oldPath, newPath, index = 0) {
  const oldKey = oldPath[index];
  const updated = Array.isArray(obj) ? obj.slice() : { ...obj };
  if (index + 1 === oldPath.length) {
    const newKey = newPath[index];
    // $FlowFixMe number or string is fine here
    updated[newKey] = updated[oldKey];
    if (Array.isArray(updated)) {
      updated.splice(oldKey, 1);
    } else {
      delete updated[oldKey];
    }
  } else {
    // $FlowFixMe number or string is fine here
    updated[oldKey] = copyWithRename(obj[oldKey], oldPath, newPath, index + 1);
  }
  return updated;
}

export function deletePathInObject(object, path) {
  const length = path.length;
  const last = path[length - 1];
  if (object != null) {
    const parent = getInObject(object, path.slice(0, length - 1));
    if (parent) {
      if (Array.isArray(parent)) {
        parent.splice(last, 1);
      } else {
        delete parent[last];
      }
    }
  }
}

export function cleanForBridge(data, isPathAllowed, path = []) {
  return;
  // if (data !== null) {
  //   const cleanedPaths = [];
  //   const unserializablePaths = [];
  //   const cleanedData = dehydrate(
  //     data,
  //     cleanedPaths,
  //     unserializablePaths,
  //     path,
  //     isPathAllowed
  //   );
  //
  //   return {
  //     data: cleanedData,
  //     cleaned: cleanedPaths,
  //     unserializable: unserializablePaths
  //   };
  // } else {
  //   return null;
  // }
}

export function getInObject(object, path) {
  return path.reduce((reduced, attr) => {
    if (reduced) {
      if (Object.hasOwnProperty.call(reduced, attr)) {
        return reduced[attr];
      }
      if (typeof reduced[Symbol.iterator] === "function") {
        // Convert iterable to array and return array[index]
        //
        // TRICKY
        // Don't use [...spread] syntax for this purpose.
        // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
        // Other types (e.g. typed arrays, Sets) will not spread correctly.
        return Array.from(reduced)[attr];
      }
    }

    return null;
  }, object);
}

export function getEffectDurations(root) {
  // Profiling durations are only available for certain builds.
  // If available, they'll be stored on the HostRoot.
  let effectDuration = null;
  let passiveEffectDuration = null;
  const hostRoot = root.current;
  if (hostRoot != null) {
    const stateNode = hostRoot.stateNode;
    if (stateNode != null) {
      effectDuration =
        stateNode.effectDuration != null ? stateNode.effectDuration : null;
      passiveEffectDuration =
        stateNode.passiveEffectDuration != null
          ? stateNode.passiveEffectDuration
          : null;
    }
  }
  return { effectDuration, passiveEffectDuration };
}
