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
