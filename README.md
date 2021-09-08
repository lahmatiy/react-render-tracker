[![NPM version](https://img.shields.io/npm/v/react-render-tracker.svg)](https://www.npmjs.com/package/react-render-tracker)

# React render tracker

React render tracker – a tool to discover performance issues related to unintended re-renders

> STATUS: MVP / proof of concept
>
> The project is at an early stage of development. Lots of things have yet to be added and polished (see [roadmap](https://github.com/lahmatiy/react-render-tracker/issues/6)). Feel free to create an issue if you found a bug or have an idea.

![Demo](https://user-images.githubusercontent.com/270491/132439005-2525b8a6-c9f4-4171-b37a-39b0f3ed666c.png)

Features:

- Cumulative state of component's tree including unmounted components (can be hidden by a toggle in the top right corner) and number of updates (re-renders)
- Two types of hierarchy in component's tree: owner-based (created by, better for render tracking, that's by default) and parent-based (composed by)
- Event log for a component or its subtree, grouped by a React's commit of batch of rendering work, with some details on changes in components like context, state and props
- Self and total (including subtree rendering) cumulative time or all component renders (hidden by default, use toggle in the right top corner to enable it)
- Overall stats on events and component instances in status bar
- More to come... (see [roadmap](https://github.com/lahmatiy/react-render-tracker/issues/6))

## How to use

### Option 1 – Using with browser's devtools

1. Add to your html file a script before a React app:

```html
<script src="path/to/react-render-tracker.js"></script>
```

> NOTE: A path for a bundle in the npm package is `dist/react-render-tracker.js`

You can use CDN services to include script with no installation:

```html
<!-- unpkg -->
<script src="https://unpkg.com/react-render-tracker"></script>
<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/react-render-tracker"></script>
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

4. Open your html and url of Rempl server. You should see connected instance of React render tracker, click on it to see UI.

## How to start playground locally

```
npm install
npm start
```

Open a URL displayed in console (e.g. `Server listen on http://localhost:3000`).

## License

MIT
