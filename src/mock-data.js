const treeData = {
  "1": {
    "children": [],
    "depth": 0,
    "displayName": "App",
    "hocDisplayNames": null,
    "id": 1,
    "isCollapsed": false,
    "key": null,
    "ownerId": 0,
    "parentId": 0,
    "type": 11,
    "weight": 0,
    "changes": {
      "2021-29-07-WHATEVER": {
        "phase": "mount"
      },
      "2021-29-07-WHATEVER2": {
        "phase": "update",
        "reason": ["setState", "props"]
      },
      "2021-29-07-WHATEVER3": {
        "phase": "update",
        "reason": ["props"]
      }
    }
  },
  "3": {
    "children": [
      5
    ],
    "depth": 0,
    "displayName": "App",
    "hocDisplayNames": null,
    "id": 3,
    "isCollapsed": false,
    "key": null,
    "ownerId": 0,
    "parentId": 1,
    "type": 5,
    "weight": 1
  },
  "5": {
    "children": [
      11,
      13,
      15,
      17
    ],
    "depth": 1,
    "displayName": "UnmountedTester",
    "hocDisplayNames": null,
    "id": 5,
    "isCollapsed": false,
    "key": null,
    "ownerId": 3,
    "parentId": 3,
    "type": 5,
    "weight": 1,
    "isUnmounted": true
  },
  "11": {
    "children": [],
    "depth": 2,
    "displayName": "TreeItem",
    "hocDisplayNames": null,
    "id": 11,
    "isCollapsed": false,
    "key": "0",
    "ownerId": 5,
    "parentId": 5,
    "type": 5,
    "weight": 1
  },
  "13": {
    "children": [],
    "depth": 2,
    "displayName": "TreeItem",
    "hocDisplayNames": null,
    "id": 13,
    "isCollapsed": false,
    "key": "1",
    "ownerId": 5,
    "parentId": 5,
    "type": 5,
    "weight": 1
  },
  "15": {
    "children": [],
    "depth": 2,
    "displayName": "TreeItem",
    "hocDisplayNames": null,
    "id": 15,
    "isCollapsed": false,
    "key": "2",
    "ownerId": 5,
    "parentId": 5,
    "type": 5,
    "weight": 1
  },
  "17": {
    "children": [],
    "depth": 2,
    "displayName": "TreeItem",
    "hocDisplayNames": null,
    "id": 17,
    "isCollapsed": false,
    "key": "3",
    "ownerId": 5,
    "parentId": 5,
    "type": 5,
    "weight": 1
  }
};


export default treeData;
