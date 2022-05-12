import React from "react";
import { useSubscription } from "./subscription";
import { Tree } from "../../data";

export function useTreeUpdateSubscription(tree: Tree) {
  const [state, setState] = React.useState(0);

  useSubscription(
    () => tree.subscribe(() => setState(state => state + 1)),
    [tree]
  );

  return state;
}
