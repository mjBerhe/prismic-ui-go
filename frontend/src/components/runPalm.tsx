import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { Button } from "./ui/Button";
import { LoadingIcon } from "./svgs/LoadingIcon";
import { Check, CircleX } from "lucide-react";
import { getRelativePath, getTraversalPathToFolder, resolvePath } from "../utils/output";
import { useLiabilityConfigStore, useUIConfigStore } from "../stores";
import { LiabilityConfig } from "../types/pages";
import { TextEffect } from "./ui/motion-ui/text-effect";

export const RunPalm: React.FC<{
  palmFolderPath: string;
  palmConfigPath: string;
  moduleType?: "valuation" | "liability_analytics" | "risk_analytics";
  isDisabled?: boolean;
}> = ({ palmFolderPath, palmConfigPath, moduleType, isDisabled }) => {
  const { config, configPath } = useLiabilityConfigStore();
  const { config: uiConfig } = useUIConfigStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hadError, setHadError] = useState(false);

  const [output, setOutput] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Listen for stdout output
    const unlistenOutput = listen<string>("process-output", (event) => {
      setOutput((prev) => [...prev, event.payload]);
    });

    // Listen for stderr output
    const unlistenError = listen<string>("process-error", (event) => {
      setErrors((prev) => [...prev, event.payload]);
    });

    // Listen for process completion
    const unlistenFinished = listen<string[]>("process-finished", (event) => {
      console.log(event);
      setStatus(event.payload[0] ? event.payload[0] : null);
    });

    // Cleanup listeners on unmount
    return () => {
      unlistenOutput.then((unlisten) => unlisten());
      unlistenError.then((unlisten) => unlisten());
      unlistenFinished.then((unlisten) => unlisten());
    };
  }, []);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [output]);

  const runPalm = async () => {
    try {
      setStatus(null);

      setIsLoading(true);
      setHadError(false);

      const pathToConfig = getTraversalPathToFolder(palmFolderPath, palmConfigPath);
      const updatedPath = ensurePalmLauncherPath(palmFolderPath);

      const fileNames = await invoke<string[]>("get_file_names_in_directory", {
        folderPath: palmConfigPath,
      });
      const newConfigFileName = getNextLiabilityConfigVersion(fileNames);

      await invoke("save_json_file", {
        path: `${configPath}/${newConfigFileName}`,
        jsonData: JSON.stringify(config, null, 2),
      });

      await invoke("run_palm_exe", {
        pathToExe: updatedPath,
        pathToConfig,
        liabilityConfigFilename: newConfigFileName,
      });

      if (
        (moduleType === "valuation" ||
          "liability_analytics" ||
          moduleType === "risk_analytics") &&
        palmFolderPath
      ) {
        const runName = config.sFileName;
        const relativeOutputFolderToPalmFolder = config.sCashPath;

        const outputFilePath = resolvePath(
          palmFolderPath,
          moduleType === "valuation"
            ? `${relativeOutputFolderToPalmFolder}` // for valuation
            : moduleType === "liability_analytics"
            ? `${relativeOutputFolderToPalmFolder}${runName}_LiabilityOutput_Scenario_0.csv` // for liability_analytics
            : `${relativeOutputFolderToPalmFolder}DebugInfo_Scenario_${runName}_0.csv` // for risk_analytics
        );

        // run script with this path
        const relativeOutputFileToPythonScript = getRelativePath(
          uiConfig.generateInputFolderPath,
          outputFilePath
        );
        // console.log(relativeOutputFileToPythonScript);

        await invoke("run_python_script", {
          pathToScript: uiConfig.parseOutputPath,
          workingDir: uiConfig.generateInputFolderPath,
          args: [moduleType, relativeOutputFileToPythonScript, runName],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <h1 className="text-xl font-semibold">Run pALM</h1>

      <div className="flex flex-col min-h-[360px] px-4 pt-2 overflow-x-">
        <div className="bg-black flex flex-col overflow-y-auto h-[360px] shadow-lg px-4 py-3 mt-2 rounded-lg">
          {output.map((x, i) => (
            <TextEffect
              key={`${x}-${i}`}
              per="line"
              preset="slide"
              className="text-sm/6 text-gray-300 font-light break-words whitespace-normal"
            >
              {x}
            </TextEffect>
          ))}
          <div ref={bottomRef}></div>
        </div>
      </div>

      <div className="flex w-full justify-center mt-4 items-center gap-x-2">
        {isLoading && <LoadingIcon />}
        {status === "Process completed successfully" && !hadError && (
          <Check color="green" size={30} className="" />
        )}
        <Button
          onClick={runPalm}
          disabled={isDisabled || !palmFolderPath || !palmConfigPath || isLoading}
        >
          {isLoading ? "Running" : "Run pALM"}
        </Button>
      </div>
    </div>
  );
};

const ensurePalmLauncherPath = (path: string): string => {
  const launcher = "pALMLauncher.exe";

  // Check if the path already ends with "/pALMLauncher.exe"
  if (!path.endsWith(launcher)) {
    // If not, append it to the path
    return `${path}${path.endsWith("/") ? "" : "/"}${launcher}`;
  }

  // Return the path unchanged if it already ends with "/pALMLauncher.exe"
  return path;
};

const getNextLiabilityConfigVersion = (fileNames: string[]): string => {
  const baseName = "liability_config";
  const extension = ".json";

  // Find files that match the "liability_config" format
  const matchingFiles = fileNames.filter(
    (name) => name.startsWith(baseName) && name.endsWith(extension)
  );

  // Extract versions and find the maximum version number
  const maxVersion = matchingFiles.reduce((max, file) => {
    const match = file.match(/liability_config_(\d+)\.json$/);
    const version = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, version);
  }, 0);

  // Construct the next version file name
  const nextVersion = maxVersion + 1;
  return `${baseName}_${nextVersion}${extension}`;
};
