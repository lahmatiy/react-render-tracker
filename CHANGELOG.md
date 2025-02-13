## 0.7.7 (February 13, 2023)

- Fixed crash when React's global devtools hook is defined but `undefined` (#42)

## 0.7.6 (October 17, 2023)

- Fixed tracking of mounts for hydrated trees (#37)

## 0.7.5 (October 6, 2023)

- Added tracking for all known React hooks
- Added new section `Hooks` in fiber details
- Added `Component stats` page
- Added `displayName` field to `fiber-type-def` event
- Fixed missed `console.log()` (#36)

## 0.7.4 (August 16, 2023)

- Fixed multiple creation of source map instances for a single script
- Improved hook path capturing:
  - Adjusted the stack trace limit to capture up to 25 entries, guaranteeing a minimum of 20 path entries, an improvement from the previous 6 (#30)
  - Implemented an alternative method for path extraction to cater to scenarios where a function is either unnamed or its name doesn't start with `use`
  - Resolved compatibility issues with WhyDidYouRender (#22)
  - Fixed an issue where the hooks list doubled in some cases when a component rendered in StrictMode

## 0.7.3 (June 9, 2023)

- Added `StrictMode` capturing and displaying in components tree
- Fixed capturing component owner in some cases
- Fixed tracking for `useSyncExternalStorage` hook usage that may lead to infinite updates loop (#35)

## 0.7.2 (June 7, 2023)

- Added tracking for `useSyncExternalStore` hook changes
- Added tracking for `useTransition` hook changes
- Fixed crash when `useSyncExternalStore` hook is used (#34)
- Fixed missed details capturing for first state hook changes

## 0.7.1 (June 7, 2023)

- Added selecting a component on the page (#31)
- Added DOM elements highlighting of a component on hover in component's tree (#31)
- Added capturing and displaying host components (DOM elements for `react-dom`) and portals
- Added ancestors section in component's details panel
- Added displaying a list of detected unsupported renderers on the React renderer connection waiting screen. This should help figure out why a React can't be connected.
- (experimental) Considered `production` and `profiling` React builds as partially functional, i.e. RRT works but some data might is not capturing (e.g. a component owner and most of update triggers)
- Fixed memory leaks related to keeping unmounted fibers by RRT internal dictionaries
- Fixed navigation when a fiber is pinned
- Removed "Blocking mode" mark for a render root as outdated
- Added `dist` files to `exports`
- Reworked `headless-browser-client` build to provide a standalone bundles

## 0.7.0 (July 10, 2022)

- Added renderer's name & version into the toolbar
- Reduced a main bundle size by ~53Kb (12%)
- Excluded source files from the npm package
- Bumped rempl to [`1.0.0-alpha.23`](https://github.com/rempl/rempl/releases/tag/v1.0.0-alpha.23)
- Made all dependencies as developer only

## 0.6.2 (May 16, 2022)

- **[EXPERIMENTAL]** Added new entry points (exports):
  - `react-render-tracker/data-client` – [data client API](README.md#option-3--data-client-in-a-browser) to interact with React Render Tracker
  - `react-render-tracker/headless-browser-client` – [an adapter for headless browser frameworks](README.md#option-4--data-client-in-a-headless-browser-framework) which is applied to a page object to get the data client API in the context of the page
- Added warning when non-development version of React is used instead of trying to inspect it and crash
- Bumped rempl to [`1.0.0-alpha.20`](https://github.com/rempl/rempl/releases/tag/v1.0.0-alpha.20)

## 0.6.1 (November 29, 2021)

- Added an events loading pause button
- Changed events loading behaviour to avoid a commit's events splitting across loading data chunks
- Fixed tree traversal after a leaf deletion, i.e. on event log reset (#20)

## 0.6.0 (November 16, 2021)

- Added info sections for a selected fiber:
  - Props updates and fiber's reaction (update or bailout) on it
  - Consumers list for a context provider fibers
  - Used providers including paths of `React.useContext()` calls for function components
  - Recomputes and changes in `useMemo()` and `useCallback()` hooks
- Added commit label in event log
- Added tracking for `setState()` and `dispatch()` callbacks of `useReducer()` and `useState()` hooks for function components
- Added tracking for `setState()` and `forceUpdate()` method calls for class components
- Added update bailouts events and a count badge for a fiber on fiber tree (supported bailouts: `React.memo()`, `shouldComponentUpdate()` and no changes in state)
- Added a render mode badge for render roots
- Added open in editor feature which might be enabled and configured with `openSourceLoc` option on `<script>` (see [detail in readme](README.md#opensourceloc))
- Added source location resolving to an original module locations using source maps
- Added shortcuts in search input:
  - `Enter` – select next matched fiber
  - `Shift+Enter` – select previous matched fiber
  - `Escape` – clear search input
- Added prev/next fiber selection with `Up` and `Down` keys
- Added support for Firefox
- Reworked event list markup and style
- Improved warnings on update changes:
  - Display which change triggers a warning in update changes details (on change type badge)
  - Display warning for a context value shallow equal change for the context provider fiber only (instead of a warning on each consumer fiber)
- Added warning when multiple instances of React are detected and attach to the first one only instead of unpredictable behaviour (multiple instances of React will be supported in the future releases)
- Improved testing for supported version of React/ReactDOM, improved warning for unsupported renderer (something different from `react-dom` or a version prior `16.9` which is lowest supported version for now)

## 0.5.0 (October 10, 2021)

- Added short info block for selected fiber
- Added an iteration over fibers of the same type as selected fiber on fiber info card
- Added pin subtree feature (by double click on a fiber tree leaf or pin button on fiber info block in sidebar)
- Added auto scrolling to viewport for selected leaf in fiber tree's if needed
- Added a selection history navigation
- Added auto selection for a fiber on search
- Added displaying of the updated component that caused mount or unmount
- Improved UI responsiveness and performance for app's with thousands of fibers
- Improved markup of fiber's tree and event log
- Fixed object diff rest changes notes
- Fixed context hook paths duplication in case of re-renders

## 0.4.0 (September 23, 2021)

- Added displaying of the updated component that caused the selected component to be updated (if not itself)
- Added hook call stack for `useState` and `useReducer` hooks
- Added hook call stacks for `useContext` hook
- Added output for received bytes of events data in status bar
- Added "Waiting for..." splash block when no events have been received for some time since UI initialization or initial events loading in progress
- Added support for `data-config="inpage:true"` attribute on injected `<script>` to open UI right in the page
- Significantly boosted events loading (up to 5-10 times)
- Reduced bundle size from 414Kb to 319Kb by eliminating duplicate of `rempl`
- Improved object diff for update events
- Improved display names to visually distinguish fibers with the same name:
  - `Button`, `Button'2`, `Button'3`...
  - `Context.Provider` → `AnonymousContext.Provider`, `AnonymousContext'2.Provider`...
- Changed default for displaying the list of events, initially do not show events for component's subtree
- Fixed crash when used for React prior 16.9 because of another internals for dependencies (context)
- Fixed an issue with solutions like `react-refresh` that might not work when using RRT without React Devtools
- Fixed overriding the hook by other tools when React Devtools is not used by defining `__REACT_DEVTOOLS_GLOBAL_HOOK__` as non-configurable like React Devtools does
- Fixed an issue where in some cases events were not loaded because the `getEvents()` remote method is not yet available
- Fixed displaying changes in a context's Provider
- Fixed issue when children or event log doesn't update in parent-child relationship mode

## 0.3.0 (September 8, 2021)

- Reworked an order of events in the way React performs them (in more natural way, i.e. component's tree traversal order)
- Redesigned presenting of event types in the event log, with grouping by React's batch of work commit
- Added "Update trigger" marker (lighting icon) to events in event log which indicates the components that are _potentially_ responsible for the update (now we cannot distinguish between which changes in the component became the trigger for the update, and which were added during the rendering of the component)
- Replaced "Parent update" marker in event log as meaningless
- Added toggle for showing timings, by default timings are hidden as they are not that useful yet
- Added tracking for functional component's context changes and displaying it in event log if any
- Added simple value changes description for hooks
- Added displaying component's key if any
- Improved display name generation for anonymous components by adding an index number to distinguish instances of different components
- Changed hooks changes tracking to handle only state related, i.e. useState()/useDispatcher()
- Changed simple value serialization to distinguish an empty object/array with non-empty
- Fixed owner-based hierarchy for root level components
- Fixed state and hooks changes computation depending on component type, i.e. class-based or functional
- Fixed unmounted render root displaying

## 0.2.0 (August 27, 2021)

- Added reset event log button which also vanish unmounted components (#9, @ilyaryabchinski)
- Added status bar with overall event statistics
- Fixed event loading throttling delay which was committed by mistake
- Fixed various bugs with event log displaying
- Some performance optimizations

## 0.1.2 (August 25, 2021)

- Fixed `TypeError` for `null` serialization in publisher (#10, @jeetiss)
- Removed unnecessary packages from dependencies

## 0.1.1 (August 23, 2021)

- Fixed path for distributive file for `unpkg` and `jsdelivr`

## 0.1.0 (August 23, 2021)

- Initial release
