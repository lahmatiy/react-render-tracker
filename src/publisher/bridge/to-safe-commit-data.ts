import {
  ReactCommitData,
  TransferChangeDescription,
  TransferCommitData,
} from "../types";

/**
 * Fixes possible circular dependencies in component props
 * to allow data serialisation and sending over rempl.
 * @param data
 */
export function toSafeCommitData(data: ReactCommitData) {
  const changeDescriptions: { [key: number]: TransferChangeDescription } =
    Object.create(null);

  for (const [key, entry] of data.changeDescriptions) {
    const { didHooksChange, hooks, props, state } = entry;
    const safeEntry: TransferChangeDescription = {
      ...entry,
      props: null,
      state: null,
    };

    if (props) {
      safeEntry.props = props.map(entry => ({
        name: entry.name,
        changed: entry.prev !== entry.next,
      }));
    }

    if (state) {
      safeEntry.state = state.map(entry => ({
        name: entry.name,
        changed: entry.prev !== entry.next,
      }));
    }

    if (didHooksChange && hooks?.length) {
      safeEntry.hooks = hooks.map(hook => ({
        name: hook.name,
        prev: {}, // FIXME
        next: {}, // FIXME
      }));
    }

    changeDescriptions[key] = safeEntry;
  }

  return { ...data, changeDescriptions } as TransferCommitData;
}
