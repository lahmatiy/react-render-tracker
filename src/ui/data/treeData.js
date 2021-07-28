const treeData = {
  "id": 1,
  "name": "App",
  "lifecycle": [
    {
      "phase": "mount",
      "timestamp": "2021-07-27T09:15:40.531Z"
    },
    {
      "phase": "update",
      "reason": "useState",
      "timestamp": "2021-07-27T09:15:40.531Z"
    }
  ],
  "children": [
    {
      "id": 2,
      "name": "Foo",
      "lifecycle": [
        {
          "phase": "mount",
          "timestamp": "2021-07-27T09:15:40.531Z"
        },
        {
          "phase": "update",
          "reason": "useContext",
          "timestamp": "2021-07-27T09:15:40.531Z"
        },
        {
          "phase": "unmount",
          "timestamp": "2021-07-27T09:15:40.531Z"
        }
      ],
      "children": [
        {
          "id": 3,
          "name": "Bar",
          "lifecycle": [
            {
              "phase": "mount",
              "timestamp": "2021-07-27T09:15:40.531Z"
            },
            {
              "phase": "update",
              "reason": "parent",
              "timestamp": "2021-07-27T09:15:40.531Z"
            }
          ],
          "children": [
            {
              "id": 5,
              "name": "Baz",
              "lifecycle": [
                {
                  "phase": "mount",
                  "timestamp": "2021-07-27T09:15:40.531Z"
                },
                {
                  "phase": "update",
                  "reason": "parent",
                  "timestamp": "2021-07-27T09:15:40.531Z"
                }
              ],
              "children": [
                {
                  "id": 15,
                  "name": "Baz",
                  "lifecycle": [
                    {
                      "phase": "mount",
                      "timestamp": "2021-07-27T09:15:40.531Z"
                    },
                    {
                      "phase": "update",
                      "reason": "parent",
                      "timestamp": "2021-07-27T09:15:40.531Z"
                    }
                  ],
                  "children": [],
                  "unmounted": true
                },
              ],
              "unmounted": true
            },
            {
              "id": 7,
              "name": "Baz",
              "lifecycle": [
                {
                  "phase": "mount",
                  "timestamp": "2021-07-30T09:15:40.531Z"
                }
              ],
              "children": [
                {
                  "id": 8,
                  "name": "Baz",
                  "lifecycle": [
                    {
                      "phase": "mount",
                      "timestamp": "2021-07-30T09:15:40.531Z"
                    }
                  ],
                  "children": [
                    {
                      "id": 9,
                      "name": "Baz",
                      "lifecycle": [
                        {
                          "phase": "mount",
                          "timestamp": "2021-07-30T09:15:40.531Z"
                        }
                      ],
                      "children": [
                        {
                          "id": 10,
                          "name": "Baz",
                          "lifecycle": [
                            {
                              "phase": "mount",
                              "timestamp": "2021-07-30T09:15:40.531Z"
                            }
                          ],
                          "children": [
                            {
                              "id": 11,
                              "name": "Baz",
                              "lifecycle": [
                                {
                                  "phase": "mount",
                                  "timestamp": "2021-07-30T09:15:40.531Z"
                                }
                              ],
                              "children": [
                                {
                                  "id": 12,
                                  "name": "Card",
                                  "lifecycle": [
                                    {
                                      "phase": "mount",
                                      "timestamp": "2021-07-30T09:15:40.531Z"
                                    }
                                  ],
                                  "children": [
                                    {
                                      "id": 13,
                                      "name": "Baz",
                                      "lifecycle": [
                                        {
                                          "phase": "mount",
                                          "timestamp": "2021-07-30T09:15:40.531Z"
                                        }
                                      ],
                                      "children": [
                                        {
                                          "id": 14,
                                          "name": "Test",
                                          "lifecycle": [
                                            {
                                              "phase": "mount",
                                              "timestamp": "2021-07-30T09:15:40.531Z"
                                            }
                                          ],
                                          "children": []
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },

                        {
                          "id": 23,
                          "name": "Header",
                          "lifecycle": [
                            {
                              "phase": "mount",
                              "timestamp": "2021-07-30T09:15:40.531Z"
                            }
                          ],
                          "children": [
                            {
                              "id": 20,
                              "name": "AsideLayout",
                              "lifecycle": [
                                {
                                  "phase": "mount",
                                  "timestamp": "2021-07-30T09:15:40.531Z"
                                }
                              ],
                              "children": [
                                {
                                  "id": 21,
                                  "name": "Baz",
                                  "lifecycle": [
                                    {
                                      "phase": "mount",
                                      "timestamp": "2021-07-30T09:15:40.531Z"
                                    }
                                  ],
                                  "children": [
                                    {
                                      "id": 22,
                                      "name": "Test",
                                      "lifecycle": [
                                        {
                                          "phase": "mount",
                                          "timestamp": "2021-07-30T09:15:40.531Z"
                                        }
                                      ],
                                      "children": []
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "unmounted": true
        }
      ],
      "unmounted": true
    },
    {
      "id": 4,
      "name": "Bar",
      "lifecycle": [
        {
          "action": "mount",
          "timestamp": "2021-07-27T09:15:40.531Z"
        }
      ],
      "children": []
    }
  ]
}

export default treeData;
