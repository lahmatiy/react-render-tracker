import { Tree, TreeNode } from "./tree";

function createTree(str: string) {
  type StackNode = {
    offset: number;
    parentId: number;
    lastId: number;
    prev: StackNode | null;
  };

  const tree = new Tree();
  let stack: StackNode = { offset: 0, parentId: 0, lastId: 0, prev: null };
  let parentId = 0;
  let lastId = 0;
  let offset = 0;

  for (const line of str
    .replace(/^\s*\n/, "")
    .trimEnd()
    .split(/\n/)) {
    const [, nodeOffsetStr, nodeIdStr] = line.match(/^(\s*)(\d+)$/) || [];

    if (nodeIdStr === undefined) {
      throw new Error("Bad line");
    }
    const nodeOffset = nodeOffsetStr.length;
    const nodeId = Number(nodeIdStr);

    if (tree.has(nodeId)) {
      throw new Error("Duplicate id " + nodeId);
    }

    if (nodeOffset > offset) {
      stack = { offset, parentId, lastId, prev: stack };
      tree.add(nodeId, lastId);
      parentId = lastId;
      lastId = nodeId;
    } else if (nodeOffset === offset) {
      tree.add(nodeId, parentId);
      lastId = nodeId;
      stack.lastId = lastId;
    } else {
      while (stack.prev !== null) {
        ({ offset, parentId, lastId, prev: stack } = stack);
        if (offset <= nodeOffset) {
          break;
        }
      }

      tree.add(nodeId, parentId);
      stack.lastId = nodeId;
      lastId = nodeId;
    }

    offset = nodeOffset;
  }

  return tree;
}

// function checkNode(node: TreeNode) {
//   if (node.firstChild === null || node.lastChild === null) {
//     return node.firstChild !== node.lastChild
//       ? "both firstChild & lastChild should be null"
//       : false;
//   } else {
//     const childNodes = [];
//     let cursor: TreeNode | null = node.firstChild;

//     while (cursor !== null) {
//       childNodes.push(cursor);
//       cursor = cursor.nextSibling;
//     }

//     for (const child of childNodes) {
//       if (child.parent !== node) {
//         return "bad parent";
//       }
//     }

//     cursor = node.lastChild;
//     while (cursor !== null) {
//       if (childNodes.pop() !== cursor) {
//         return "bad prevSibling/nextSibling";
//       }
//       cursor = cursor.prevSibling;
//     }

//     if (childNodes.length > 0) {
//       return "bad prevSibling/nextSibling";
//     }
//   }
// }

function collectIds(tree: Tree, backward = false) {
  const ids = [];
  const nextProp = backward ? "prev" : "next";
  let cursor: TreeNode | null = backward ? tree.last : tree.first;

  // for (const [id, node] of tree.nodes) {
  //   console.log(`${id} -> ${node.parent && node.parent.id}`);
  // }
  // process.exit();

  while (cursor !== null) {
    ids.push(cursor.id);
    cursor = cursor[nextProp];
  }

  return ids;
}

test("ok", () => {
  const tree = createTree(`
    1
    2
      3
    4
      5
      6
        7
      8
    9
  `);

  tree.delete(1);
  tree.delete(2);
  tree.delete(5);
  tree.delete(9);

  expect(collectIds(tree)).toStrictEqual([0, 4, 6, 7, 8]);
  expect(collectIds(tree, true)).toStrictEqual([8, 7, 6, 4, 0]);
});
