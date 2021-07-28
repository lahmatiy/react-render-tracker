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
  let hasNameMatch = (element.displayName || '')
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

export const getTreeData = (data) => {
  let highestDepth = -1;

  const dataArray = Object.keys(data).map(id => {
    const element = data[id];
    if (element.depth > highestDepth) highestDepth = element.depth;
    return element;
  })

  const result = {};
  for (let i = highestDepth; i >= -1; i--) {
    const components = dataArray.filter(d => d.depth === i);

    components.forEach(component => {
      const clonedData = JSON.parse(JSON.stringify(component));
      clonedData.children = [];

      if (component.children) {
        component.children.forEach(childId => {
          clonedData.children.push(result[childId]);
          delete result[childId];
        })
      }
      result[component.id] = clonedData;
    })
  }

  const keys = Object.keys(result);
  const firstId = keys[0];

  return result[firstId];
}
