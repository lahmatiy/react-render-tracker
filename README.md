# React render tracker

React render tracker – a tool to discover performance issues related to unintended re-renders

> STATUS: MVP / proof of concept
>
> The project is at an early stage of development. Lots of things have yet to be added and polished. The initial plan can be found [here](https://github.com/lahmatiy/react-render-tracker/issues/6). Feel free to create an issue if you found a bug or have an idea.

![image](https://user-images.githubusercontent.com/270491/130531090-b77802ed-4245-435f-9b27-f50c1bc1a796.png)

Features:

- Show component tree grouped by owner (rendered by) component or by parent (composed by) component. Default is by owner component, can be changed by a toggle in the top right corner.
- Self and total (including subtree components) cumulative time or all component renders
- Number of component's re-renders
- Show unmounted components (can be disabled by a toggle in the top right corner)
- Event log for a component or its subtree
- More to come...

## How to use

### Option 1 – Using with devtools

1. Add to your html file a script before a React app:

```html
<script src="path/to/react-render-tracker.js"></script>
```

2. Install [Rempl extension](https://chrome.google.com/webstore/detail/rempl/hcikjlholajopgbgfmmlbmifdfbkijdj) for Chromium based browser (other browsers might be added later)

3. Open your html page and browser's devtools, open Rempl tab. That's it.

### Option 2 – Using with a web-socket server

Since project is based on [Rempl](https://github.com/rempl/rempl), it's also possible to use other hosts, e.g. [rempl-cli](https://github.com/rempl/rempl-cli) to launch a server. In this case, it is possible to inspect a react application launched in any web view with web sockets support.

1. Run following commands:

```
> npm install -g rempl-cli
> rempl
```

This will launch a Rempl server on port `8177`. Use `--port` option to specify any other port. See more option with `rempl --help` command.

2. Add to your html file a script before a React app:

```html
<script src="path/to/react-render-tracker.js"></script>
```

3. Add `<meta>` tag with specified origin of the Rempl server:

```html
<meta name="rempl:server" content="localhost:8177" />
```

4. Open your html and url of Rempl server. You should see connected instance of React render tracker

![image](https://user-images.githubusercontent.com/270491/130532702-e78fc867-da3a-41d9-9e0f-cc0c07c89dd5.png)

## How to start playground locally

```
npm install
npm start
```

Open a URL displayed in console (e.g. `Server listen on http://localhost:3000`).

## License

MIT
