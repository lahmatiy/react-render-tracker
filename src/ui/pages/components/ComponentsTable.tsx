import * as React from "react";
import { useFiberTypeStat } from "../../utils/fiber-maps";
import { FiberStat, FiberTypeStat } from "../../types";
import ButtonExpand from "../../components/fiber-tree/ButtonExpand";
import FiberId from "../../components/common/FiberId";
import { usePageContext } from "../../utils/page";
import { AppPage } from "..";
import { useSelectedId } from "../../utils/selection";

type Totals = Omit<
  FiberTypeStat,
  "typeId" | "typeDef" | "displayName" | "fibers"
>;
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
  <T extends FiberTypeStat | FiberStat>(a: T, b: T) => number
> = {
  displayName: () => 0,
  // count: (a, b) => a.mounts - b.mounts,
  time: (a, b) => a.mountTime + a.updateTime - (b.mountTime + b.updateTime),
  mounts: (a, b) => a.mounts - b.mounts,
  mountTime: (a, b) => a.mountTime - b.mountTime,
  unmounts: (a, b) => a.unmounts - b.unmounts,
  updates: (a, b) => a.updates - b.updates,
  updateTime: (a, b) => a.updateTime - b.updateTime,
  hooks: () => 0,
};
const typeSortings: Record<
  Sorting,
  (a: FiberTypeStat, b: FiberTypeStat) => number
> = {
  ...sortings,
  displayName: (a, b) => (a.displayName < b.displayName ? -1 : 1),
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
    const compare = typeSortings[sorting.slice(1) as Sorting];
    return sorting[0] === "+"
      ? compare
      : (a: FiberTypeStat, b: FiberTypeStat) => compare(b, a);
  }, [sorting]);
  const fiberSortingFn = React.useMemo(() => {
    const compare = sortings[sorting.slice(1) as Sorting];
    return sorting[0] === "+"
      ? compare
      : (a: FiberStat, b: FiberStat) => compare(b, a);
  }, [sorting]);
  const { openPage } = usePageContext();
  const { select } = useSelectedId();
  const selectFiber = React.useCallback(
    (fiberId: number) => {
      select(fiberId);
      openPage(AppPage.ComponentTree);
    },
    [openPage, select]
  );

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
          <TypeStatRow
            key={stat.typeId}
            stat={stat}
            selectFiber={selectFiber}
            sorting={fiberSortingFn}
            filterRx={filterRx}
          />
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

const TypeStatRow = React.memo(function TypeStatRow({
  stat,
  selectFiber,
  sorting,
  filterRx,
  initExpanded = false,
}: {
  stat: FiberTypeStat;
  selectFiber: (fiberId: number) => void;
  sorting: (a: FiberStat, b: FiberStat) => number;
  filterRx: RegExp | null;
  initExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initExpanded);

  const fiberCount = stat.fibers.size;
  const firstFiberId = fiberCount === 1 ? [...stat.fibers.keys()][0] : 0;
  const match = filterRx != null ? stat.displayName.match(filterRx) : null;
  let name: React.ReactNode = stat.displayName;

  if (match !== null) {
    const offset = match.index || 0;
    const length = match[0].length;
    const startStr = stat.displayName.slice(0, offset);
    const matchStr = stat.displayName.slice(offset, offset + length);
    const endStr = stat.displayName.slice(offset + length);

    name = (
      <>
        {startStr}
        <span className="match">{matchStr}</span>
        {endStr}
      </>
    );
  }

  return (
    <>
      <tr className="type-stat">
        <td>
          <span className="main-cell-content">
            {fiberCount === 1 ? (
              <>
                <span
                  className="component-name"
                  title={stat.displayName}
                  onClick={() => selectFiber(firstFiberId)}
                >
                  <span className="details-fiber-link__name">{name}</span>
                </span>
                <FiberId id={firstFiberId} />
              </>
            ) : (
              <>
                <ButtonExpand expanded={expanded} setExpanded={setExpanded} />
                <span className="component-name" title={stat.displayName}>
                  {name}
                </span>
                <span className="component-instances">{fiberCount}</span>
              </>
            )}
          </span>
        </td>
        <NumberCells numbers={stat} />
        <td className="hooks">{stat.typeDef.hooks.length || null}</td>
      </tr>
      {expanded && fiberCount > 1 && (
        <FibersStatRows
          stat={stat}
          selectFiber={selectFiber}
          sorting={sorting}
        />
      )}
    </>
  );
});

const FibersStatRows = React.memo(function FibersStatRows({
  stat,
  selectFiber,
  sorting,
}: {
  stat: FiberTypeStat;
  selectFiber: (fiberId: number) => void;
  sorting: (a: FiberStat, b: FiberStat) => number;
}) {
  const rows = [...stat.fibers.values()].sort(sorting);

  return rows.map(fiberStat => (
    <FiberStatRow
      key={fiberStat.fiberId}
      fiberStat={fiberStat}
      selectFiber={selectFiber}
    />
  ));
});

const FiberStatRow = React.memo(function FiberStatRow({
  fiberStat,
  selectFiber,
}: {
  fiberStat: FiberStat;
  selectFiber: (fiberId: number) => void;
}) {
  const name = fiberStat.typeStat.displayName;

  return (
    <tr className="fiber-stat">
      <td>
        <span className="main-cell-content">
          <span
            className="component-name"
            title={name}
            onClick={() => selectFiber(fiberStat.fiberId)}
          >
            <span className="details-fiber-link__name">{name}</span>
          </span>
          <FiberId id={fiberStat.fiberId} />
        </span>
      </td>
      <NumberCells numbers={fiberStat} />
      <td />
    </tr>
  );
});

function Footer({ totals }: { totals: Totals }) {
  return (
    <tr>
      <th>Totals:</th>
      <NumberCells numbers={totals} />
      <th />
    </tr>
  );
}

function NumberCells({ numbers }: { numbers: FiberTypeStat | Totals }) {
  const totalTime = numbers.mountTime + numbers.updateTime;
  const mountTime = numbers.mounts ? numbers.mountTime : NaN;
  const updateTime = numbers.updates ? numbers.updateTime : NaN;

  return (
    <>
      <td className="time">{totalTime.toFixed(1)}</td>
      <td>{numbers.mounts || null}</td>
      <td className="time">{numOrNothing(mountTime)}</td>
      <td>{numbers.updates || null}</td>
      <td className="time">{numOrNothing(updateTime)}</td>
      <td>{numbers.unmounts || null}</td>
    </>
  );
}

const ComponentsTableMemo = React.memo(ComponentsTable);
ComponentsTableMemo.displayName = "ComponentsTable";

export default ComponentsTableMemo;
