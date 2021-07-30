import { ChangeDescription, CommitData } from "../types";

/**
 * Fixes possible circular dependencies in component props
 * to allow data serialisation and sending over rempl.
 * @param data
 */
export function toSafeCommitData(data: CommitData) {
  const changeDescriptions = Array.from(
    data.changeDescriptions.entries()
  ).reduce((seed, [key, entry]) => {
    const { didHooksChange, hooks, props } = entry;
    const safeEntry = {
      ...entry,
      props: !props
        ? []
        : // FIXME: fix typings in commit data
          props.map((p: any) => ({
            name: p.name,
            changed: p.prev !== p.next,
          })),
    };

    if (didHooksChange && hooks?.length) {
      safeEntry.hooks = hooks.map(hook => ({
        name: hook.name,
        prev: {},
        next: {},
      }));
    }

    seed.set(key, safeEntry as unknown as ChangeDescription);

    return seed;
  }, new Map<number, ChangeDescription>());

  return { ...data, changeDescriptions } as unknown as CommitData;
}
