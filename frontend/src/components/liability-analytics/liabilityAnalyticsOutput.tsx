import { useState, useEffect } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import * as dfd from "danfojs/dist/danfojs-browser/src";
import { ReadFiles } from "../../../wailsjs/go/main/App";

import { cn } from "../../utils/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";
import OutputTable from "../ui/OutputTable";

type Option = {
  id: number;
  name: string;
  data: string[][];
  initData: string[][];
};

type DateTypeOptions = "Monthly" | "Yearly";
type AggregateType = "sum" | "point in time";
const dateOptions: DateTypeOptions[] = ["Monthly", "Yearly"];

const amountDisplayYears = 60;
const amountDisplayMonths = amountDisplayYears * 12;

export const LiabilityAnalyticsOutput: React.FC<{
  exportFolderPath: string | null;
}> = ({ exportFolderPath }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // const [fileOptions, setFileOptions] = useState<FileOption[]>([]);
  const [fileOptions, setFileOptions] = useState<Option[]>([]);
  const [selectedFile, setSelectedFile] = useState<Option>();

  const [monthlyDataFrame, setMonthlyDataFrame] = useState<dfd.DataFrame>();

  const readOutputFiles = async (exportFolderPath: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const csvData = await ReadFiles(
        exportFolderPath,
        "Parsed_LiabilityOutput_Scenario"
      );

      if (csvData) {
        const options: Option[] = csvData.map((x, i) => ({
          id: i,
          name: x.Name,
          data: x.Data,
          initData: x.Data,
        }));
        setFileOptions(options);
      }
    } catch (error) {
      setError(error as string);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // want to only read output files if they are coming from the correct dir
    if (exportFolderPath && exportFolderPath.includes("liability_analytics")) {
      readOutputFiles(exportFolderPath);
    }
  }, [exportFolderPath]);

  // whenever an output file is selected, create a dataframe to display
  useEffect(() => {
    const createDataFrames = (values: string[][]) => {
      let monthlyData = values.map((row) => [
        row[0],
        ...row.slice(1).map(Number).slice(0, amountDisplayMonths),
      ]);

      const rowOrder = ["Total Cashflow", "Claims", "Expense"];
      monthlyData = monthlyData.sort(
        ([keyA], [keyB]) =>
          rowOrder.indexOf(keyA as string) - rowOrder.indexOf(keyB as string)
      );

      let monthlyDF = new dfd.DataFrame(monthlyData, {
        columns: [
          "Month",
          ...Array.from({ length: amountDisplayMonths }, (_, i) => `Month ${i + 1}`),
        ],
      });

      setMonthlyDataFrame(monthlyDF);
    };

    if (selectedFile) {
      createDataFrames(selectedFile.data);
    }
  }, [selectedFile]);

  const handleCreateExcelFile = () => {
    if (monthlyDataFrame) {
      dfd.toExcel(monthlyDataFrame, {
        fileName: "Results.xlsx",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center w-full gap-y-2">
        <div className="flex w-full">
          <h1 className="text-xl font-semibold">Liability Output</h1>
        </div>

        <div className="flex items-center w-full gap-x-6">
          <Listbox value={selectedFile} onChange={setSelectedFile}>
            <ListboxButton
              className={cn(
                "relative block w-[300px] rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                "overflow-hidden whitespace-nowrap truncate",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              )}
            >
              {selectedFile?.name ?? "Select Output File"}
              <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className={cn(
                "relative min-w-[300px] max-w-[calc(100vw-32px)] z-100 my-1 rounded-lg bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
              )}
            >
              {fileOptions?.length > 0 ? (
                fileOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    value={option}
                    className="flex cursor-default items-center gap-2 rounded-md py-1.5 px-3 select-none data-[focus]:bg-white/10"
                  >
                    <p className="text-sm/6 text-white">{option.name}</p>
                  </ListboxOption>
                ))
              ) : (
                <div className="py-1.5 px-3">
                  <p className="text-sm/6 text-white">No options available</p>
                </div>
              )}
            </ListboxOptions>
          </Listbox>

          <Button
            onClick={() => exportFolderPath && readOutputFiles(exportFolderPath)}
            variant={"outline"}
            disabled={isLoading || !exportFolderPath}
          >
            Refresh Output
          </Button>

          <Button
            className="ml-auto"
            disabled={!monthlyDataFrame}
            onClick={handleCreateExcelFile}
          >
            Download Output
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600 h-[200px] flex justify-center items-center">
          <span>Reading Output Files...</span>
        </div>
      ) : monthlyDataFrame ? (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600">
          <OutputTable dataFrame={monthlyDataFrame} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600 h-[200px] flex justify-center items-center">
          <span>Select output file to view results</span>
        </div>
      )}
    </div>
  );
};
