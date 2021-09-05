const cachedDisplayNames = new WeakMap<any, string>();
let anonymousSeedId = 1;

export function getDisplayName(type: any): string {
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
    displayName = "Anonymous" + String(anonymousSeedId++);
  }

  cachedDisplayNames.set(type, displayName);

  return displayName;
}
