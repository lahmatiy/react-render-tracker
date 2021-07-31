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

export const getTreeData = (components, groupByParent = false) => {
  const groupKey = groupByParent ? "parentId" : "ownerId";
  const groupedComponents = new Map();
  const componentById = new Map();
  const roots = [];

  for (const component of components) {
    const groupId = component[groupKey];
    const clonedComponent = {
      ...component,
      children: null,
    };

    componentById.set(component.id, clonedComponent);

    if (groupedComponents.has(groupId)) {
      groupedComponents.get(groupId).push(clonedComponent);
    } else {
      groupedComponents.set(groupId, [clonedComponent]);
    }
  }

  for (const [id, children] of groupedComponents) {
    if (componentById.has(id)) {
      componentById.get(id).children = children;
    } else {
      roots.push(...children);
    }
  }

  return {
    componentById,
    roots,
  };
};
