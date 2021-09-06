import * as React from "react";
import { TestCase } from "../types";

function Toolbar({
  input,
  button,
}: {
  input: React.ReactNode;
  button: React.ReactNode;
}) {
  return (
    <div id="toolbar">
      {input}
      {button}
    </div>
  );
}

function Input({
  value,
  onInput,
}: {
  value: string;
  onInput: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onInput={e => onInput((e.target as HTMLInputElement).value)}
    />
  );
}

function Button({
  caption,
  onClick,
}: {
  caption: React.ReactNode;
  onClick: () => void;
}) {
  return <button onClick={onClick}>{caption}</button>;
}

const List = function List({ children }: { children?: React.ReactNode }) {
  return <ul>{children}</ul>;
};

function ListItem({ caption }: { caption: string }) {
  return <li>{caption}</li>;
}

function Root() {
  const [name, setName] = React.useState("World");

  return (
    <div className="app">
      <Toolbar
        input={<Input value={name} onInput={setName} />}
        button={
          <Button
            caption="Click me!"
            onClick={() => alert(`Hello, ${name}!`)}
          />
        }
      />
      <List>
        {["This", "is", "example"].map(text => (
          <ListItem key={text} caption={text} />
        ))}
      </List>
    </div>
  );
}

export default {
  title: "App #1",
  Root,
} as TestCase;
