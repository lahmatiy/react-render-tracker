import * as React from "react";
import * as ReactDOM from "react-dom/client";

function App() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    console.log("rendered");
  });

  return (
    <>
      <h1>Hello world</h1>
      <div>{count}</div>
      <button id="inc-button" onClick={() => setCount(count + 1)}>
        Inc
      </button>
    </>
  );
}

const reactRoot = ReactDOM.createRoot(document.getElementById("app"));

reactRoot.render(<App />);
