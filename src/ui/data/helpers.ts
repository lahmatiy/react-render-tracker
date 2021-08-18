import { MessageElement, TreeElement } from "../types";

export const handleFilterDataElement = (
  data: TreeElement[],
  searched: string,
  showDisabled = false
) => {
  let rootsArray: TreeElement[] = JSON.parse(JSON.stringify(data));

  rootsArray = rootsArray.filter(rootNode => showDisabled || rootNode.mounted);

  for (const rootNode of rootsArray) {
    rootNode.children = rootNode.children.filter(element =>
      getHasElementMatch(element, searched, showDisabled)
    );
  }

  return rootsArray;
};

const getHasElementMatch = (
  element: TreeElement,
  displayNameFilter: string,
  showDisabled = false
) => {
  const isDisabled = !showDisabled && !element.mounted;
  const hasNameMatch = !displayNameFilter
    ? true
    : (element.displayName || "")
        .toLowerCase()
        .includes(displayNameFilter.toLowerCase());
  const hasChildren = element.children && element.children.length;
  let hasChildMatch = false;

  if (hasChildren) {
    element.children = element.children.filter(child => {
      return getHasElementMatch(child, displayNameFilter, showDisabled);
    });
    hasChildMatch = element.children.length > 0;
  }

  const hasMatch = !isDisabled && (hasChildMatch || hasNameMatch);

  return hasMatch;
};

export const getTreeData = (
  components: MessageElement[],
  groupByParent = false
) => {
  const groupKey = groupByParent ? "parentId" : "ownerId";
  const groupedComponents: Map<number, TreeElement[]> = new Map();
  const componentById: Map<number, TreeElement> = new Map();
  const roots: TreeElement[] = [];

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
