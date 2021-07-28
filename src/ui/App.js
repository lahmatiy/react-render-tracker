import React, { useState, useMemo } from "react";

import { getTreeData, handleFilterDataElement } from "./data/helpers";

import TreeElement from "./components/TreeElement";
import ElementInfo from "./components/element/ElementInfo";
import Card from "./components/ui/Card";
import ToolsHeader from "./components/layout/ToolsHeader";

function App({ data }) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [searched, setSearched] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return null;
    const parsedData = getTreeData(data);
    return handleFilterDataElement(parsedData, searched);
  }, [data, searched]);

  return (
    <div className="App">
      <ToolsHeader
        setSearched={setSearched}
        searched={searched}
        selected={selectedElement}
      />
      <div className="tools-content">
        <div>
          <Card>
            {filteredData && (
              <TreeElement
                data={filteredData}
                onSelect={setSelectedElement}
                selectedId={selectedElement?.id}
                root
              />
            )}
          </Card>
        </div>
        {selectedElement && <ElementInfo data={selectedElement} />}
      </div>
    </div>
  );
}

export default App;
