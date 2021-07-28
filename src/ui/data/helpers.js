export const handleFilterDataElement = (data, searched) => {
  const result = JSON.parse(JSON.stringify(data));

  if (!result) {
    return result;
  }

  result.children = result.children.filter(element => {
    return getHasElementMatch(element, searched);
  });

  return result;
};

const getHasElementMatch = (element, searched) => {
  let hasNameMatch = element.name
    .toLowerCase()
    .includes(searched.toLowerCase());
  let hasChildMatch;
  let hasChildren = element.children && element.children.length;

  if (hasChildren) {
    element.children = element.children.filter(child => {
      return getHasElementMatch(child, searched);
    });
    hasChildMatch = element.children.length;
  }
  const hasMatch = hasChildMatch || hasNameMatch;

  return hasMatch;
};
