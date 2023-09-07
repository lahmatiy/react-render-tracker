import * as React from "react";
import { useFiberTypeStat } from "../../utils/fiber-maps";
import { FiberTypeStat } from "../../types";

type Totals = Omit<FiberTypeStat, "typeId" | "typeDef" | "displayName">;
type Sorting =
  | "displayName"
  | "time"
  | "mounts"
  | "mountTime"
  | "updates"
  | "updateTime"
  | "unmounts"
  | "hooks";
type OrderedSorting = `+${Sorting}` | `-${Sorting}`;
const sortings: Record<
  Sorting,
  (a: FiberTypeStat, b: FiberTypeStat) => number
> = {
  displayName: (a, b) => (a.displayName < b.displayName ? -1 : 1),
  // count: (a, b) => a.mounts - b.mounts,
  time: (a, b) => a.mountTime + a.updateTime - (b.mountTime + b.updateTime),
  mounts: (a, b) => a.mounts - b.mounts,
  mountTime: (a, b) => a.mountTime - b.mountTime,
  unmounts: (a, b) => a.unmounts - b.unmounts,
  updates: (a, b) => a.updates - b.updates,
  updateTime: (a, b) => a.updateTime - b.updateTime,
  hooks: (a, b) => a.typeDef.hooks.length - b.typeDef.hooks.length,
};

function buildRx(pattern: string, flags?: string) {
  try {
    return new RegExp("(" + pattern + ")", flags);
  } catch (e) {}

  return new RegExp(
    "((?:" + pattern.replace(/[\[\]\(\)\?\+\*\{\}\\]/g, "\\$&") + ")+)",
    flags
  );
}

function ComponentsTable({ filter }: { filter: string | null }) {
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

  const createTh = (caption: string, colSorting: OrderedSorting) => (
    <Th sorting={colSorting} currentSorting={sorting} setSorting={setSorting}>
      {caption}
    </Th>
  );

  const filterRx = React.useMemo(
    () =>
      filter === null || filter.trim() === "" ? null : buildRx(filter, "i"),
    [filter]
  );
  const filteredFiberTypeStat = React.useMemo(
    () =>
      filterRx === null
        ? fiberTypeStat
        : fiberTypeStat.filter(stat => filterRx.test(stat.displayName)),
    [fiberTypeStat, filterRx]
  );
  const sortedFiberTypeStat = React.useMemo(
    () => filteredFiberTypeStat.slice().sort(sortingFn),
    [filteredFiberTypeStat, sortingFn]
  );
  const totals = React.useMemo(() => {
    const totals: Totals = {
      mounts: 0,
      mountTime: 0,
      unmounts: 0,
      updates: 0,
      updateTime: 0,
    };

    for (const row of filteredFiberTypeStat) {
      for (const key of Object.keys(totals) as Array<keyof Totals>) {
        const value = row[key];
        if (value !== null) {
          totals[key] += value;
        }
      }
    }

    return totals;
  }, [filteredFiberTypeStat]);

  if (!fiberTypeStat.length) {
    return <div className="app-page-components-table__empty">No events</div>;
  }

  if (!filteredFiberTypeStat.length) {
    return (
      <div className="app-page-components-table__empty">Nothig matched</div>
    );
  }

  return (
    <table className="app-page-components-table">
      <thead>
        <tr>
          {createTh("Type", "+displayName")}
          {createTh("Time", "-time")}
          {createTh("Mount", "-mounts")}
          {createTh("Mount", "-mountTime")}
          {createTh("Update", "-updates")}
          {createTh("Update", "-updateTime")}
          {createTh("Unmnt", "-unmounts")}
          {createTh("Hooks", "-hooks")}
        </tr>
      </thead>
      <tbody>
        {sortedFiberTypeStat.map(stat => (
          <ComponentRow key={stat.typeId} stat={stat} filterRx={filterRx} />
        ))}
      </tbody>
      <tfoot>
        <Footer totals={totals} />
      </tfoot>
    </table>
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

function numOrNothing(num: number) {
  return typeof num === "number" && isFinite(num) ? num.toFixed(1) : null;
}

function ComponentRow({
  stat,
  filterRx,
}: {
  stat: FiberTypeStat;
  filterRx: RegExp | null;
}) {
  const totalTime = stat.mountTime + stat.updateTime;
  const mountTime = stat.mounts ? stat.mountTime : NaN;
  const updateTime = stat.updates ? stat.updateTime : NaN;
  const match = filterRx != null ? stat.displayName.match(filterRx) : null;
  let startStr = stat.displayName;
  let matchStr = "";
  let endStr = "";

  if (match !== null) {
    const offset = match.index || 0;
    const length = match[0].length;

    startStr = stat.displayName.slice(0, offset);
    matchStr = stat.displayName.slice(offset, offset + length);
    endStr = stat.displayName.slice(offset + length);
  }

  return (
    <tr>
      <td>
        <span className="component-name">
          {startStr}
          <span className="match">{matchStr}</span>
          {endStr}
        </span>
      </td>
      <td className="time">{totalTime.toFixed(1)}</td>
      <td>{stat.mounts}</td>
      <td className="time">{numOrNothing(mountTime)}</td>
      <td>{stat.updates || null}</td>
      <td className="time">{numOrNothing(updateTime)}</td>
      <td>{stat.unmounts || null}</td>
      <td className="hooks">{stat.typeDef.hooks.length || null}</td>
    </tr>
  );
}

function Footer({ totals }: { totals: Totals }) {
  const totalTime = totals.mountTime + totals.updateTime;
  const mountTime = totals.mounts ? totals.mountTime : NaN;
  const updateTime = totals.updates ? totals.updateTime : NaN;

  return (
    <tr>
      <th>Totals:</th>
      <th className="time">{totalTime.toFixed(1)}</th>
      <th>{totals.mounts}</th>
      <th className="time">{numOrNothing(mountTime)}</th>
      <th>{totals.updates || null}</th>
      <th className="time">{numOrNothing(updateTime)}</th>
      <th>{totals.unmounts || null}</th>
      <th></th>
    </tr>
  );
}

const ComponentsTableMemo = React.memo(ComponentsTable);
ComponentsTableMemo.displayName = "ComponentsTable";

export default ComponentsTableMemo;
