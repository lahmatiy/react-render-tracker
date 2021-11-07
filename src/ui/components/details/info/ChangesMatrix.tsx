import * as React from "react";
import { TransferChangeDiff } from "../../../types";
import { Diff } from "../diff/Diff";

type UpdateChangesRow = {
  num: number;
  main: JSX.Element | string;
  values: Array<null | {
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
  }> | null;
};

function UpdateChangesMatrixRow({
  headers,
  data,
}: {
  headers: string[];
  data: UpdateChangesRow;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { values } = data;

  return (
    <>
      <tr
        className={
          "changes-matrix__row" +
          (!values ? " changes-matrix__row_no-details" : "")
        }
        onClick={values ? () => setExpanded(expanded => !expanded) : undefined}
      >
        <td>{data.main}</td>
        {values?.map((value, index) => (
          <td
            key={index}
            className={
              value !== null
                ? value.diff === false
                  ? "shallow-equal"
                  : "has-diff"
                : "no-diff"
            }
          />
        )) || <td colSpan={headers.length} className="no-diff" />}
        <td />
      </tr>
      {expanded && values && (
        <tr className="changes-matrix__row-details">
          <td colSpan={(data.values?.length || 0) + 2}>
            {values.map((change, idx) =>
              change === null ? null : (
                <div key={idx} className="changes-matrix__diff-line">
                  {headers[idx]} <Diff diff={change.diff} values={change} />
                </div>
              )
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function ChangesMatrix({
  mainHeader,
  headers,
  data,
}: {
  mainHeader: string;
  headers: string[];
  data: UpdateChangesRow[];
}) {
  return (
    <table className="changes-matrix">
      <thead>
        <tr>
          <th className="changes-matrix__main-header">
            <div>
              <span>{mainHeader}</span>
            </div>
          </th>
          {headers.map((header, index) => (
            <th
              key={index}
              title={header}
              className="changes-matrix__value-header"
            >
              <div className="changes-matrix__value-header-text-wrapper">
                <div className="changes-matrix__value-header-text">
                  {header}
                </div>
              </div>
            </th>
          ))}
          <th className="changes-matrix__header-spacer" />
        </tr>
      </thead>
      <tbody>
        {data.map(entry => (
          <UpdateChangesMatrixRow
            key={entry.num}
            headers={headers}
            data={entry}
          />
        ))}
      </tbody>
    </table>
  );
}
