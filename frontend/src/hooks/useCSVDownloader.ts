import { useState, useCallback } from "react";

interface CSVDownloaderOptions {
  filename?: string;
  bom?: boolean; // Add Byte Order Mark
}

const useCSVDownloader = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const downloadCSV = useCallback(
    (csvData: string[][], options: CSVDownloaderOptions = {}) => {
      setIsDownloading(true);
      const { filename = "data.csv", bom = true } = options;

      // 1. Convert CSV data to a CSV string
      const csvString = convertArrayToCSV(csvData, bom);

      // 2. Create a Blob
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });

      // 3. Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);

      // 4. Trigger the download
      link.click();

      // 5. Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
    },
    []
  );

  // Helper function to convert array to CSV string
  const convertArrayToCSV = (data: string[][], bom: boolean): string => {
    const csv = data
      .map((row) =>
        row
          .map(String) // Handle non-string data
          .map((cell) => cell.replace(/"/g, '""')) // Escape double quotes
          .map((cell) => `"${cell}"`) // Quote each cell
          .join(",")
      )
      .join("\r\n");

    return bom ? "\uFEFF" + csv : csv; // Add BOM for Excel
  };

  return { downloadCSV, isDownloading };
};

export default useCSVDownloader;
