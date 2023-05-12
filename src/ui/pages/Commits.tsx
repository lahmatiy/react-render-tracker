import * as React from "react";
import { useSelectedId } from "../utils/selection";
import { useCommits } from "../utils/fiber-maps";

function CommitsPageBadge() {
  const commits = useCommits();
  return <span>{commits.length}</span>;
}

function CommitsPage() {
  const { selectedId } = useSelectedId();
  const commits = useCommits().slice(-20).reverse();

  return (
    <div
      className="app-page app-page-commits"
      data-has-selected={selectedId !== null || undefined}
    >
      <table>
        <thead>
          <tr>
            <td>#</td>
            <td>Mounts</td>
            <td>Updates</td>
            <td>Unmounts</td>
          </tr>
        </thead>
        <tbody>
          {commits.map(commit => {
            const stat = commit.events.reduce((stat, event) => {
              stat[event.op] = (stat[event.op] || 0) + 1;
              return stat;
            }, Object.create(null));
            console.log(commit);

            return (
              <tr key={commit.commitId}>
                <td>{commit.commitId}</td>
                <td>{stat.mount || ""}</td>
                <td>{stat.update || ""}</td>
                <td>{stat.unmount || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const CommitsPageBadgeMemo = React.memo(CommitsPageBadge);
CommitsPageBadgeMemo.displayName = "CommitsPageBadge";

const CommitsPageMemo = React.memo(CommitsPage);
CommitsPageMemo.displayName = "CommitsPage";

export {
  CommitsPageMemo as CommitsPage,
  CommitsPageBadgeMemo as CommitsPageBadge,
};
