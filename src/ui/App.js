import React, { useState, useMemo } from "react";

import { getTreeData, handleFilterDataElement } from "./data/helpers";

import TreeElement from "./components/TreeElement";
import ElementInfo from "./components/element/ElementInfo";
import Card from "./components/ui/Card";
import ToolsHeader from "./components/layout/ToolsHeader";

function App({ data }) {
  const [selectedElement, setSelectedElement] = useState(null);
  const [searched, setSearched] = useState("");
  const [showDisabled, setShowDisabled] = useState(true);

  const filteredData = useMemo(() => {
    if (!data) return null;
    const parsedData = getTreeData(data);
    return handleFilterDataElement(parsedData, searched, showDisabled);
  }, [data, searched, showDisabled]);

  return (
    <div className="App">
      <ToolsHeader
        setSearched={setSearched}
        searched={searched}
        onShowDisabled={setShowDisabled}
        showDisabled={showDisabled}
      />
      <div className="tools-content">
        <div>
          <Card>
            {filteredData?.map(rootElement => (
                <TreeElement
                  data={rootElement}
                  onSelect={setSelectedElement}
                  selectedId={selectedElement?.id}
                  key={rootElement.id}
                  root
                />
              )
            )}
          </Card>
        </div>
        {selectedElement && <ElementInfo data={selectedElement} />}
      </div>
    </div>
  );
}

export default App;
