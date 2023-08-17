import * as React from "react";
import { useSelectedId } from "../utils/selection";
import { useFiberTypeStat } from "../utils/fiber-maps";
import { FiberTypeStat } from "../types";

type Sorting =
  | "displayName"
  | "count"
  | "time"
  | "mounted"
  | "mountTime"
  | "unmounted"
  | "updates"
  | "avgUpdates"
  | "updateTime"
  | "hooks";
type OrderedSorting = `+${Sorting}` | `-${Sorting}`;
const sortings: Record<
  Sorting,
  (a: FiberTypeStat, b: FiberTypeStat) => number
> = {
  displayName: (a, b) => (a.displayName < b.displayName ? -1 : 1),
  count: (a, b) => a.mounts - b.mounts,
  time: (a, b) => a.mountTime + a.updateTime - (b.mountTime + b.updateTime),
  mounted: (a, b) => a.mounts - a.unmounts - (b.mounts - b.unmounts),
  mountTime: (a, b) => a.mountTime / a.mounts - b.mountTime / b.mounts,
  unmounted: (a, b) => a.unmounts - b.unmounts,
  updates: (a, b) => a.updates - b.updates,
  avgUpdates: (a, b) => a.updates / a.mounts - b.updates / b.mounts,
  updateTime: (a, b) =>
    (a.updates ? a.updateTime / a.updates : 0) -
    (b.updates ? b.updateTime / b.updates : 0),
  hooks: (a, b) => a.typeDef.hooks.length - b.typeDef.hooks.length,
};

function ComponentsPageBadge() {
  const types = useFiberTypeStat();
  return <span>{types.length}</span>;
}

function ComponentsPage() {
  const { selectedId } = useSelectedId();
  const fiberTypeStat = useFiberTypeStat();

  const [sorting, setSorting] = React.useReducer(
    (prevState: OrderedSorting, nextState: OrderedSorting) =>
      nextState === prevState
        ? (prevState.replace(/^./, m =>
            m === "-" ? "+" : "-"
          ) as OrderedSorting)
        : nextState,
    "+displayName"
  );
  const sortingFn = React.useMemo(() => {
    const compare = sortings[sorting.slice(1) as Sorting];
    return sorting[0] === "+"
      ? compare
      : (a: FiberTypeStat, b: FiberTypeStat) => compare(b, a);
  }, [sorting]);
  const sortedFiberTypeStat = React.useMemo(
    () => fiberTypeStat.slice().sort(sortingFn),
    [fiberTypeStat, sortingFn]
  );
  const createTh = (caption: string, colSorting: OrderedSorting) => (
    <Th sorting={colSorting} currentSorting={sorting} setSorting={setSorting}>
      {caption}
    </Th>
  );

  return (
    <div
      className="app-page app-page-components"
      data-has-selected={selectedId !== null || undefined}
    >
      <table className="app-page-stat-table">
        <thead>
          <tr>
            {createTh("Type", "+displayName")}
            {createTh("Count", "-count")}
            {createTh("Time", "-time")}
            {createTh("Mount", "-mounted")}
            {createTh("Mount", "-mountTime")}
            {createTh("Unmount", "-unmounted")}
            {createTh("Updates", "-updates")}
            {createTh("Avg(U)", "-avgUpdates")}
            {createTh("Update", "-updateTime")}
            {createTh("Hooks", "-hooks")}
          </tr>
        </thead>
        <tbody>
          {sortedFiberTypeStat.map(stat => (
            <ComponentRow key={stat.typeId} stat={stat} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  sorting,
  currentSorting,
  setSorting,
}: {
  children: string;
  sorting: OrderedSorting;
  currentSorting: OrderedSorting;
  setSorting: (nextSorting: OrderedSorting) => void;
}) {
  return (
    <th
      {...(sorting
        ? {
            className:
              sorting.slice(1) === currentSorting.slice(1)
                ? `sortable ${currentSorting[0] === "+" ? "asc" : "desc"}`
                : "sortable",
            onClick: () => setSorting(sorting),
          }
        : null)}
    >
      {children}
    </th>
  );
}

function ComponentRow({ stat }: { stat: FiberTypeStat }) {
  const totalTime = stat.mountTime + stat.updateTime;
  const avgUpdates = stat.updates / stat.mounts;
  const mountTime = stat.mountTime / stat.mounts;
  const updateTime = stat.updates ? stat.updateTime / stat.updates : 0;

  return (
    <tr>
      <td>{stat.displayName}</td>
      <td>{stat.mounts}</td>
      <td className="time">{totalTime.toFixed(1)}</td>
      <td>{stat.mounts - stat.unmounts || ""}</td>
      <td className="time">{mountTime.toFixed(1)}</td>
      <td>{stat.unmounts || ""}</td>
      <td>{stat.updates || ""}</td>
      <td>{avgUpdates ? avgUpdates.toFixed(1) : ""}</td>
      <td className="time">{updateTime ? updateTime.toFixed(1) : ""}</td>
      <td>{stat.typeDef.hooks.length || "–"}</td>
    </tr>
  );
}

const ComponentsPageBadgeMemo = React.memo(ComponentsPageBadge);
ComponentsPageBadgeMemo.displayName = "ComponentsPageBadge";

const ComponentsPageMemo = React.memo(ComponentsPage);
ComponentsPageMemo.displayName = "ComponentsPage";

export {
  ComponentsPageMemo as ComponentsPage,
  ComponentsPageBadgeMemo as ComponentsPageBadge,
};
