import {
  ReactChangeDescription,
  ReactCommitData,
  TransferChangeDescription,
  UpdateElementMessage,
} from "../types";

/**
 * Fixes possible circular dependencies in component props
 * to allow data serialisation and sending over rempl.
 * @param data
 */
export function parseCommitChanges(
  data: ReactCommitData,
  seen: WeakSet<ReactChangeDescription> = new Set()
) {
  const output: UpdateElementMessage[] = [];
  const timestamp = data.timestamp ?? Date.now();

  for (const [id, entry] of data.changeDescriptions) {
    if (seen.has(entry)) {
      continue;
    }

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

    output.push({ op: "update", id, timestamp, changes: safeEntry });
    seen.add(entry);
  }

  return output;
}
