import { useState, useEffect } from "react";
import { ReadFiles } from "../../../wailsjs/go/main/App";
import useCSVDownloader from "../../hooks/useCSVDownloader";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";

import { cn } from "../../utils/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";

type Option = {
  id: number;
  name: string;
  data: string[][];
  initData: string[][];
};

export const SAAOutput: React.FC<{
  exportFolderPath: string | null;
}> = ({ exportFolderPath }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fileOptions, setFileOptions] = useState<Option[]>([]);
  const [selectedFile, setSelectedFile] = useState<Option>();

  const { downloadCSV, isDownloading } = useCSVDownloader();

  const data =
    selectedFile && fileOptions.find((x) => x.name === selectedFile.name)?.data;

  const readFiles = async (exportFolderPath: string) => {
    try {
      setIsLoading(true);

      const csvData = await ReadFiles(exportFolderPath, "Parsed_");
      console.log(csvData);

      if (csvData) {
        const options: Option[] = csvData.map((x, i) => ({
          id: i,
          name: x.Name,
          data: x.Data,
          initData: x.Data,
        }));
        console.log(options);
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
                  {data[0].map((header, i) => (
                    <th
                      key={i}
                      className="bg-dark-700 sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      {header === "BEL"
                        ? "BEL at t0"
                        : header === "Dividend"
                        ? "PVDE at 12%"
                        : header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {data.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((value, j) => (
                      <td
                        key={j}
                        className={cn("px-6 py-4 whitespace-nowrap bg-dark-700")}
                      >
                        {(j !== 2 || i == 0) &&
                          Math.round(parseFloat(value)).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
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
