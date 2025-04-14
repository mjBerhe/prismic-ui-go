import { useState, useEffect } from "react";
import { ReadFiles } from "../../../wailsjs/go/main/App";
import useCSVDownloader from "../../hooks/useCSVDownloader";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { invoke } from "@tauri-apps/api/core";

import { cn } from "../../utils/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";

type Option = {
  id: number;
  name: string;
  data: string[];
  initData: string[][];
};

type EquityOption = {
  id: number;
  name: "Equity" | "No Equity";
};

const downloadTypeOptions: EquityOption[] = [
  { id: 0, name: "Equity" },
  { id: 1, name: "No Equity" },
];

export const ValuationOutput: React.FC<{
  exportFolderPath: string | null;
}> = ({ exportFolderPath }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fileOptions, setFileOptions] = useState<Option[]>([]);
  const [selectedFile, setSelectedFile] = useState<Option>();

  const [downloadType, setDownloadType] = useState<EquityOption>(downloadTypeOptions[0]);

  const { downloadCSV, isDownloading } = useCSVDownloader();

  const selectedOutputFileName = selectedFile?.name.substring(
    selectedFile.name.indexOf("SBA_without_Equity_") + "SBA_without_Equity_".length,
    selectedFile.name.lastIndexOf(".csv")
  );

  const data =
    selectedFile && fileOptions.find((x) => x.name === selectedFile.name)?.data;

  const readFiles = async (exportFolderPath: string) => {
    try {
      setIsLoading(true);

      const csvData = await ReadFiles(exportFolderPath, "SBA_without_Equity", false);

      if (csvData) {
        const options: Option[] = csvData.map((x, i) => ({
          id: i,
          name: x.Name,
          data: x.Data[1] ? x.Data[1] : [], // data is in second row of csv file
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
    if (exportFolderPath) {
      readFiles(exportFolderPath);
    }
  }, [exportFolderPath]);

  // download raw monthly equity/noequity files
  // need to make sure Combined_Scenario file exists, which is created with resultParser.py
  const handleCreateExcelFile = async () => {
    try {
      setIsDownloadLoading(true);
      setError(null);

      const fileName = `Combined_Scenario_${selectedOutputFileName}_nestedinner_${
        downloadType.name === "Equity" ? "equity" : "noequity"
      }.csv`;

      const filePath = `${
        exportFolderPath?.endsWith("/") ? exportFolderPath : exportFolderPath + "/"
      }${fileName}`;

      const csvContent = await invoke<string>("read_csv", { filePath });

      // Preserve formatting and create a downloadable file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(url);
    } catch (error) {
      setError(error as string);
      console.error("Error reading CSV file:", error);
    } finally {
      setIsDownloadLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    selectedFile?.initData && downloadCSV(selectedFile.initData);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center w-full gap-y-2">
        <div className="flex w-full">
          <h1 className="text-xl font-semibold">SBA BEL</h1>
        </div>

        <div className="flex items-center w-full gap-x-6">
          <Listbox value={selectedFile} onChange={setSelectedFile}>
            <ListboxButton
              className={cn(
                "relative block w-[350px] rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              )}
            >
              {selectedFile?.name ?? "Select Output File"}
              <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className={cn(
                "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
              )}
            >
              {fileOptions?.length > 0 ? (
                fileOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    value={option}
                    className="flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
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
            onClick={() => exportFolderPath && readFiles(exportFolderPath)}
            variant={"outline"}
            disabled={isLoading || !exportFolderPath}
          >
            Refresh Output
          </Button>

          <div className="flex gap-x-6 ml-auto">
            <Listbox value={downloadType} onChange={setDownloadType}>
              <ListboxButton
                className={cn(
                  "relative block w-[150px] rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                )}
              >
                {downloadType.name}
                <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
              </ListboxButton>
              <ListboxOptions
                anchor="bottom"
                className={cn(
                  "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                  "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                )}
              >
                {downloadTypeOptions?.length > 0 ? (
                  downloadTypeOptions.map((option) => (
                    <ListboxOption
                      key={option.id}
                      value={option}
                      className="flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
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
              className=""
              disabled={!exportFolderPath || !selectedOutputFileName || isDownloadLoading}
              onClick={handleDownloadCSV}
            >
              Download Monthly BEL
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600 h-[200px] flex justify-center items-center">
          <span>Reading Output Files...</span>
        </div>
      ) : data ? (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600 p-4">
          <div className="overflow-x-auto overflow-y-auto max-h-[700px]">
            <table className="min-w-full divide-y divide-dark-600">
              <thead>
                <tr>
                  {data.map((_, i) => (
                    <th
                      key={i}
                      className="bg-dark-700 sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      S{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                <tr>
                  {data.map((x, i) => (
                    <td key={i} className={cn("px-6 py-4 whitespace-nowrap bg-dark-700")}>
                      {Math.round(parseFloat(x)).toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl mt-4 bg-dark-700 border border-dark-600 h-[200px] flex justify-center items-center">
          <span>Select output file to view results</span>
        </div>
      )}
    </div>
  );
};
