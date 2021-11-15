[![NPM version](https://img.shields.io/npm/v/react-render-tracker.svg)](https://www.npmjs.com/package/react-render-tracker)

# React Render Tracker

React Render Tracker – a tool to discover performance issues related to unintended re-renders.

React Render Tracker (RRT) presents component’s tree state over the time and an event log related to a selected component (fiber) or its subtree. It doesn't provide a complete state of the components, but the difference between their states. It's not a replacement for React Devtools, but a compliment to it with a focus on investigation of changes in app's component tree (like mounts, updates and unmounts) and their causes.

> STATUS: MVP / proof of concept
>
> The project is at an early stage of development. Lots of things have yet to be added and polished (see [roadmap](https://github.com/lahmatiy/react-render-tracker/issues/6)). Feel free to create an issue if you found a bug or have an idea.

![Demo](https://user-images.githubusercontent.com/270491/136706759-1a36ab59-cbde-4d30-878f-3e5f83b83312.png)

Features:

- The state of component's tree over time including unmounted components (can be hidden by a toggle in the top right corner) and number of updates (re-renders)
- Two types of component's tree hierarchy: owner-based (how components are created, that's better for updates tracking, selected by default) and parent-based (how components are mounted)
- The matrix of props updates and update bailouts for a selected fiber
- Displaying context used on fibers and locations where context is reading using hooks
- Displaying consumers list for provider fibers
- Details on useMemo() and useCallback() hook usage and recomputations for a selected fiber
- Event log for a selected component (with the option to include a subtree component's events), grouped by a React's batch of work (commit), with details on changes in context, state and props
- Displaying which component (fiber) is responsible for selected component updates
- Self and subtree rendering timings (hidden by default, use toggle in the right top corner to enable it)
- Open a source location in an editor
- Overall stats on events and component instances in the status bar
- More to come... (see [roadmap](https://github.com/lahmatiy/react-render-tracker/issues/6))

## How to use

All you need to do is to add a single `<script>` to the HTML page and open the user interface to inspect your React app.

First of all the `<script>` should be added before a React app. This script will add a special object to the global which is used by React for providing its internals to the tool for analysis (React Devtools does the same). As soon as React library is loaded and attached to the tool, RRT starts collecting data about what is going on in React's internals.

> NOTE: Multiple React library instances are not supported yet. In this case, the behavior of the RRT is unpredictable.

```html
<script src="path/to/react-render-tracker.js"></script>
```

> NOTE: A path for a bundle in the NPM package is `dist/react-render-tracker.js`

You can use a CDN service to include script with no installation from NPM:

- jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/react-render-tracker"></script>
```

- unpkg

```html
<script src="https://unpkg.com/react-render-tracker"></script>
```

Next, you need to open the user interface, one of the ways that best suits your case.

### Option #0 - Open UI right in the page

To avoid any additional installs you may just add `data-config="inpage:true"` attribute to the `<script>`. In this case, the UI will be shown right in the page of your application. That's the simplest way to try React Render Tracker in action. However, UI will perform in the same thread as your React application which may be not a good option from a performance perspective for large scale apps.

```html
<script
  src="https://cdn.jsdelivr.net/npm/react-render-tracker"
  data-config="inpage:true"
></script>
```

### Option #1 – Using with browser's devtools

1. Install Rempl extension [for Chromium](https://chrome.google.com/webstore/detail/rempl/hcikjlholajopgbgfmmlbmifdfbkijdj) based browser or [for Firefox](https://addons.mozilla.org/en-US/firefox/addon/rempl/) (other browsers might be added later)

2. Open location of your React app, then open browser's devtools and find Rempl tab here. Click it. That's it.

> NOTE: If your React application and browser's devtools were opened before Rempl extension is installed, you need to close and open browser's devtools as well as reload the page with React application.

### Option #2 – Open UI in another tab, or browser, or device...

The most universal way for a remote inspection of your React app using React Render Tracker is via a special server as a connection point between the app and React Render Tracker UI. Since RRT is based on [Rempl](https://github.com/rempl/rempl), it works with [rempl-cli](https://github.com/rempl/rempl-cli) which is used to launch such kind of a server. In this case, it becomes possible to inspect a React application launched in any web view with a WebSocket support. In fact, you can inspect a React application running in a browser with no devtools support, or Electron, or VS Code, etc.

1. Run following commands:

```
> npm install -g rempl-cli
> rempl
```

This will launch a Rempl server on port `8177`. Use `--port` option to specify any other port. See more option with `rempl --help` command.

2. Add `<meta>` tag with specified origin of the Rempl server:

```html
<meta name="rempl:server" content="localhost:8177" />
```

3. Open your application. Open Rempl server location in an evergreen browser on your choice, e.g. `http://localhost:8177` which is the default URL. You should see connected instances of React Render Tracker, select one to see the UI.

> NOTE: During MVP phase cross-browser support is not guarantee. Feel free to open an issue if something doesn't work in non-Chromium browser you use.

## Configuring React Render Tracker

React Render Tracker can be configured by the attribute `data-config` on `<script>` element:

```html
<script
  src="path/to/react-render-tracker.js"
  data-config="...options goes here..."
></script>
```

### inpage

Type: `boolean`  
Default: `false`

Opens in-page host for the tool on initialization when `true`.

### openSourceLoc

Type: `string` | `object` | `undefined`  
Default: `undefined`

Allows to enable "open in editor" feature which is disabled when value is `undefined` (by default). Option's value should be an object with the following shape (all entries are optional except `pattern`):

```js
{
  pattern: 'string',     // required
  projectRoot: 'string', // optional
  basedir: 'string',     // optional
  basedirJsx: 'string'   // optional
}
```

Where:

- `pattern` – defines an URL which should be fetched on a click by a source location link. Such URL should be an endpoint of web server which performs "open in editor" action. For `Visual Studio Code` a web server is not required (see below).
- `projectRoot` – an absolute path for a project dir, any location is appending to it.
- `basedir` – a path relative to project's dir to resolve relative paths (i.e. paths which contain `..`) before appending to `projectRoot`.
- `basedirJsx` – the same as `basedir` but for JSX locations (i.e. `__source` prop values on JSX elements); `basedir` value is used when `basedirJsx` is not specified.

In case your editor is `Visual Studio Code`, it's possible to setup "open in editor" feature without a web server, like so:

```html
<script
  src="https://cdn.jsdelivr.net/npm/react-render-tracker"
  data-config="
    openSourceLoc: {
      pattern: 'vscode://file/[file]',
      projectRoot: '/Users/username/git/project-name'
    }
  "
></script>
```

When a string value is passed for `openSourceLoc` option it's replaced with an object `{ pattern: stringValue }`, i.e.

```js
openSourceLoc: "url pattern";
// the same as ->
openSourceLoc: {
  pattern: "url pattern";
}
```

The `pattern`'s value might contain placeholders for a value substitution:

- `[filepath]` – absolute resolved location for a module, e.g. `/Users/username/git/project/src/module.js`
- `[file]` or `[loc]` – the same as `[filepath]`, but line and column are included (the same as `[filepath]:[line]:[column]`), e.g. `/Users/username/git/project/src/module.js:12:5`
- `[line]` – line of location in module's source (starting with 1)
- `[column]` – column of location in module's source (starting with 1)
- `[line0]` – zero-based line of location in module's source
- `[column0]` – zero-based column of location in module's source

## Using custom build / dev version

- Clone the repo and install deps using `npm install`
- Run dev server using `npm start` and include `<script>` with server's host:

```html
<script src="http://localhost:3000/react-render-tracker.js"></script>
```

> NOTE: In this case bundle will be rebuild on each request for the script. This version of bundle contains source maps which is good for debugging

- As alternative you could run `npm run build` to get a bundle in `dist` folder (`dist/react-render-tracker.js`)

> NOTE: This version of bundle is the same as for publishing (minified and no source maps included)

## How to start playground locally

```
npm install
npm start
```

Open a URL that will displayed in a console (e.g. `Server listen on http://localhost:3000`).

## Acknowledgments

The prototype of React Render Tracker was crafted during the Microsoft's hackathon on July 2021. Thanks to the team working on it: Dana Janoskova (@DJanoskova), Dmitrii Samsonov (@user1736), Yury Tomilin (@r04423), Maksym Kharchenko (@Bon4ik) and Raluca Vasiliu (@kubayaya).

Thanks to React Devtools authors which integration with React internals became a basis for integration implementation in React Render Tracker.

## License

MIT
