## next

- Fixed crash when used for React prior 16.9 because of another internals for dependencies (context)
- Improved object diff for update events
- Added hook call stack for `useState` and `useReducer` hooks
- Improved display names to visually distinguish fibers with the same name:
  - `Button`, `Button'2`, `Button'3`...
  - `Context.Provider` → `AnonymousContext.Provider`, `AnonymousContext'2.Provider`...

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
