import React from "react";

export const handleFilterDataElement = (data, searched, showDisabled) => {
  let rootsArray = JSON.parse(JSON.stringify(data));

  rootsArray = rootsArray.filter(rootNode => {
    return !(!showDisabled && rootNode.isUnmounted);
  });

  rootsArray.forEach(rootNode => {
    rootNode.children = rootNode.children.filter(element => {
      return getHasElementMatch(element, searched, showDisabled);
    });
  });

  return rootsArray;
};

const getHasElementMatch = (element, searched, showDisabled) => {
  let isDisabled = !showDisabled && element.isUnmounted;
  let hasNameMatch = (element.displayName || "")
    .toLowerCase()
    .includes(searched.toLowerCase());
  let hasChildMatch;
  let hasChildren = element.children && element.children.length;

  if (hasChildren) {
    element.children = element.children.filter(child => {
      return getHasElementMatch(child, searched, showDisabled);
    });
    hasChildMatch = element.children.length;
  }
  const hasMatch = !isDisabled && (hasChildMatch || hasNameMatch);

  return hasMatch;
};

export const getTreeData = data => {
  let highestDepth = 0;

  const dataArray = Object.keys(data).map(id => {
    const element = data[id];
    if (element.depth > highestDepth) highestDepth = element.depth;
    return element;
  });

  const result = {};
  for (let i = highestDepth; i >= 0; i--) {
    const components = dataArray.filter(d => d.depth === i);

    components.forEach(component => {
      const clonedData = JSON.parse(JSON.stringify(component));
      clonedData.children = [];

      if (component.children) {
        component.children.forEach(childId => {
          clonedData.children.push(result[childId]);
          delete result[childId];
        });
      }
      result[component.id] = clonedData;
    });
  }

  return Object.keys(result).map(rootId => result[rootId]);
};

export const getElementNameHighlight = (name, highlight) => {
  if (!highlight) return name;

  const re = new RegExp(highlight.toLowerCase(), "g");
  const match = re.exec(name.toLowerCase());

  let result = name;

  if (match) {
    const { index } = match;
    result = (
      <>
        {name.slice(0, index)}
        <span className="highlight">
          {name.slice(index, index + highlight.length)}
        </span>
        {name.slice(index + highlight.length)}
      </>
    );
  }

  return result;
};
