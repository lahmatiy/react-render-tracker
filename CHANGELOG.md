## next

- Fixed owner-based hierarchy for root level components
- Fixed unmounted render root displaying
- Fixed state and hooks changes computation depending on component type, i.e. class-based or functional
- Changed simple value serialization to distinguish an empty object/array with non-empty
- Added simple value changes description for hooks
- Fixed an order of events in the way React performs them
- Changed parent update -> owner update and improved its displaying in event log
- Redesigned the type of events in the event log, added commit boundaries
- Improved display name generation for anonymous components by adding an index number to distinguish instances of different components

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
