const cachedDisplayNames = new WeakMap<any, string>();
const usedDisplayNames = new Map<string, number>();

export function getDisplayName(type: any, kind = ""): string {
  const displayNameFromCache = cachedDisplayNames.get(type);
  if (typeof displayNameFromCache === "string") {
    return displayNameFromCache;
  }

  let displayName;

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (type) {
    if (typeof type.displayName === "string") {
      displayName = type.displayName;
    } else if (typeof type.name === "string" && type.name !== "") {
      displayName = type.name;
    }
  }

  if (!displayName) {
    displayName = "Anonymous" + kind;
  }

  if (usedDisplayNames.has(displayName)) {
    const num = usedDisplayNames.get(displayName) || 2;
    usedDisplayNames.set(displayName, num + 1);
    displayName += `\`${String(num)}`;
  } else {
    usedDisplayNames.set(displayName, 2);
  }

  cachedDisplayNames.set(type, displayName);

  return displayName;
}
