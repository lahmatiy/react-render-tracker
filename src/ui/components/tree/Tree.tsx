import React from "react";
import { TreeElement as ITreeElement } from "../../types";
import TreeElement, { TreeElementProps } from "./TreeLeaf";

interface TreeProps
  extends Pick<TreeElementProps, "onSelect" | "selectedId" | "highlight"> {
  roots: ITreeElement[];
}

const Tree = ({ roots, onSelect, selectedId, highlight }: TreeProps) => {
  return (
    <>
      {roots?.map(root => (
        <TreeElement
          key={root.id}
          data={root}
          onSelect={onSelect}
          selectedId={selectedId}
          highlight={highlight}
          root
        />
      ))}
    </>
  );
};

export default Tree;
