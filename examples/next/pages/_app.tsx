import * as React from "react";

function Demo() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      Counter is {count}
      <hr />
      <button onClick={() => setCount(count => count + 1)}>Increment</button>
      <button onClick={() => setCount(count => count - 1)}>Decrement</button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <h1>My App</h1>
      <Demo />
    </>
  );
}
