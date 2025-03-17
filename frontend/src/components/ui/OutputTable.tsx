import React, { useMemo } from "react";
import * as dfd from "danfojs/dist/danfojs-browser/src";
import { cn } from "../../utils/utils";

const OutputTable: React.FC<{
  dataFrame: dfd.DataFrame;
  sectionFilter?: string[];
}> = ({ dataFrame, sectionFilter }) => {
  const filteredRows = useMemo(() => {
    if (!dataFrame) return [];

    const filtered = dataFrame?.values
      .filter((row) =>
        sectionFilter
          ? Array.isArray(row) && sectionFilter.includes(row[0] as string)
          : row
      )
      .filter(
        (row, index, self) =>
          Array.isArray(row) &&
          index === (self as string[]).findIndex((t) => t[0] === row[0])
      );

    if (sectionFilter) {
      return filtered.sort(
        (a, b) =>
          sectionFilter.indexOf((a as string[])[0]) -
          sectionFilter.indexOf((b as string[])[0])
      );
    }

    return filtered;
  }, [dataFrame, sectionFilter]);

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[700px]">
      <table className="min-w-full divide-y divide-dark-600">
        <thead>
          <tr>
            {dataFrame?.columns.map((col, index) => (
              <th
                key={index}
                className="bg-dark-700 sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-600">
          {filteredRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {(row as string[] | number[]).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-6 py-4 whitespace-nowrap bg-dark-700",
                    cellIndex === 0 && "sticky left-0"
                  )}
                >
                  {typeof cell === "number"
                    ? Math.abs(cell) > 1e9
                      ? cell.toExponential(3)
                      : cell.toLocaleString()
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default React.memo(OutputTable);
